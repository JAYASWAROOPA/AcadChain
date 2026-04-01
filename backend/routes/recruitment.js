const express = require('express');
const router = express.Router();
const RecruitmentDrive = require('../models/RecruitmentDrive');
const Application = require('../models/DriveApplication');
const User = require('../models/User');
const Reputation = require('../models/Reputation');
const { protect, authorize } = require('../middleware/authMiddleware');

// 1. ADMIN CREATES RECRUITMENT DRIVE
// @desc    Create a new recruitment drive
// @route   POST /api/recruitment/create
router.post('/create', protect, authorize('admin'), async (req, res) => {
    try {
        const drive = await RecruitmentDrive.create({
            ...req.body,
            createdByAdmin: req.user._id
        });
        res.status(201).json(drive);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation Error: ' + messages.join(', ') });
        }
        res.status(500).json({ message: error.message });
    }
});

// 2. STUDENT VISIBILITY LOGIC
// @desc    Get eligible drives for student
// @route   GET /api/recruitment/student
router.get('/student', protect, authorize('student'), async (req, res) => {
    try {
        const student = req.user;
        const studentReputation = await Reputation.findOne({ studentId: student._id }) || { score: 0 };

        // Auto-close expired drives so students don't see them
        const now = new Date();
        await RecruitmentDrive.updateMany({ status: 'open', lastDate: { $lt: now } }, { status: 'closed' });

        // Find currently open, non-expired drives
        const allDrives = await RecruitmentDrive.find({ status: 'open', lastDate: { $gte: now } }).lean();

        // Check if student applied
        const applications = await Application.find({ studentId: student._id }).lean();
        const appliedDriveIds = applications.map(a => a.recruitmentId.toString());

        const eligibleDrives = allDrives.filter(drive => {
            // student.reputation >= recruitment.minReputation
            if (studentReputation.score < drive.minReputation) return false;
            
            // student.department in eligibleDepartments
            if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0) {
                if (!drive.eligibleDepartments.includes(student.department)) return false;
            }
            
            // student.year in eligibleYear
            if (drive.eligibleYear && drive.eligibleYear.length > 0) {
                if (!drive.eligibleYear.includes(student.academicYear)) return false;
            }

            return true;
        }).map(drive => {
            return {
                ...drive,
                isApplied: appliedDriveIds.includes(drive._id.toString())
            };
        });

        res.json(eligibleDrives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. MENTOR VIEW
// @desc    Get mentor recruitment view
// @route   GET /api/recruitment/mentor-view
router.get('/mentor-view', protect, authorize('faculty'), async (req, res) => {
    try {
        // Step 1: Get mentor students
        const students = await User.find({ mentorId: req.user._id, role: 'student' }).lean();
        const studentIds = students.map(s => s._id);

        // Preload reputations to evaluate score
        const reputations = await Reputation.find({ studentId: { $in: studentIds } }).lean();
        const scoreMap = {};
        reputations.forEach(r => {
            scoreMap[r.studentId.toString()] = r.score;
        });

        // Step 2 & 3: For each recruitment drive, categorize students
        const drives = await RecruitmentDrive.find().sort({ createdAt: -1 }).lean();
        
        // Get all applications for these students
        const applications = await Application.find({ studentId: { $in: studentIds } }).lean();

        const responseDrives = drives.map(drive => {
            const eligible = [];
            const registered = [];
            const notRegistered = [];

            // Get applications for THIS drive
            const appliedStudentIds = applications
                .filter(app => app.recruitmentId.toString() === drive._id.toString())
                .map(app => app.studentId.toString());

            students.forEach(student => {
                const sid = student._id.toString();
                const sScore = scoreMap[sid] || 0;
                
                // Check basic eligibility based on given criteria
                let isEligible = true;
                if (sScore < drive.minReputation) isEligible = false;
                if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0 && !drive.eligibleDepartments.includes(student.department)) isEligible = false;
                if (drive.eligibleYear && drive.eligibleYear.length > 0 && !drive.eligibleYear.includes(student.academicYear)) isEligible = false;

                if (isEligible) {
                    eligible.push(student);
                    if (appliedStudentIds.includes(sid)) {
                        registered.push(student);
                    } else {
                        notRegistered.push(student);
                    }
                }
            });

            return {
                companyDetails: {
                    companyName: drive.companyName,
                    role: drive.role,
                    minReputation: drive.minReputation,
                    lastDate: drive.lastDate
                },
                driveId: drive._id,
                stats: {
                    eligibleCount: eligible.length,
                    registeredCount: registered.length,
                    notRegisteredCount: notRegistered.length
                },
                lists: {
                    eligible,
                    registered,
                    notRegistered
                }
            };
        });

        res.json(responseDrives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. STUDENT REGISTRATION
// @desc    Apply to a drive
// @route   POST /api/recruitment/apply
router.post('/apply', protect, authorize('student'), async (req, res) => {
    try {
        const { recruitmentId } = req.body;
        const drive = await RecruitmentDrive.findById(recruitmentId);
        
        if (!drive) return res.status(404).json({ message: 'Drive not found' });
        if (drive.status !== 'open') return res.status(400).json({ message: 'Drive is closed' });

        // Double check eligibility
        const studentReputation = await Reputation.findOne({ studentId: req.user._id }) || { score: 0 };
        if (drive.minReputation > studentReputation.score) {
            return res.status(400).json({ message: 'Ineligible: Reputation score too low' });
        }
        if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0 && !drive.eligibleDepartments.includes(req.user.department)) {
            return res.status(400).json({ message: 'Ineligible: Department not supported' });
        }
        if (drive.eligibleYear && drive.eligibleYear.length > 0 && !drive.eligibleYear.includes(req.user.academicYear)) {
            return res.status(400).json({ message: 'Ineligible: Academic year not supported' });
        }
        if (drive.lastDate && new Date(drive.lastDate) < new Date()) {
            drive.status = 'closed';
            await drive.save();
            return res.status(400).json({ message: 'Drive has expired' });
        }
        if (drive.status !== 'open') {
            return res.status(400).json({ message: 'Drive is closed' });
        }

        const application = await Application.create({
            recruitmentId: drive._id,
            studentId: req.user._id,
            status: 'applied'
        });
        
        res.status(201).json(application);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Already applied' });
        res.status(500).json({ message: error.message });
    }
});

// 5. RECRUITER VIEW
// @desc    Get drive applicants by drive ID
// @route   GET /api/recruitment/company/:id
router.get('/company/:id', protect, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        const drive = await RecruitmentDrive.findById(req.params.id);
        if (!drive) return res.status(404).json({ message: 'Drive not found' });

        // Fetch applications and populate student and their mentor
        const applicants = await Application.find({ recruitmentId: drive._id })
            .populate({
                path: 'studentId',
                select: 'name department academicYear enrollmentNumber mentorId role',
                populate: { path: 'mentorId', select: 'name' }
            })
            .sort({ appliedDate: -1 });

        // Enrich with reputation scores
        const enrichedApplicants = await Promise.all(applicants.map(async (app) => {
            if (!app.studentId) return null; // Avoid errors if student was deleted
            const reputation = await Reputation.findOne({ studentId: app.studentId._id }) || { score: 0 };
            return {
                _id: app._id,
                studentName: app.studentId.name,
                department: app.studentId.department,
                reputation: reputation.score,
                mentorName: app.studentId.mentorId ? app.studentId.mentorId.name : 'None',
                status: app.status,
                appliedDate: app.appliedDate
            };
        }));

        res.json(enrichedApplicants.filter(a => a !== null));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all company drives (for Recruiter Dashboard)
// @route   GET /api/recruitment/company-drives
router.get('/company-drives', protect, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        // If strict linking is required, use recruiterEmail = req.user.email, else return all or specific ones
        // For now returning all or matching ones.
        const filter = req.user.role === 'admin' ? {} : { recruiterEmail: req.user.email };
        const drives = await RecruitmentDrive.find(filter).sort({ createdAt: -1 });
        res.json(drives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
