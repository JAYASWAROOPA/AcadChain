const express = require('express');
const router = express.Router();
const RecruitmentDrive = require('../models/RecruitmentDrive');
const DriveApplication = require('../models/DriveApplication');
const User = require('../models/User');
const Reputation = require('../models/Reputation');
const { protect, authorize } = require('../middleware/authMiddleware');

// --- ADMIN ROUTES ---

// @desc    Create a new recruitment drive
// @route   POST /api/drives/create
router.post('/create', protect, authorize('admin'), async (req, res) => {
    try {
        console.log('Creating drive with body:', JSON.stringify(req.body, null, 2));
        const drive = await RecruitmentDrive.create({
            ...req.body,
            createdByAdmin: req.user._id
        });
        res.status(201).json(drive);
    } catch (error) {
        console.error('Drive Creation Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Verification Error: ' + messages.join(', ')
            });
        }
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all drives (Admin only)
// @route   GET /api/drives/admin/all
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
    try {
        const drives = await RecruitmentDrive.find().sort({ createdAt: -1 });
        res.json(drives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle drive status
// @route   PATCH /api/drives/:id/status
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
    try {
        const drive = await RecruitmentDrive.findById(req.params.id);
        if (!drive) return res.status(404).json({ message: 'Drive not found' });

        drive.status = drive.status === 'open' ? 'closed' : 'open';
        await drive.save();
        res.json(drive);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- STUDENT ROUTES ---

// @desc    Get active eligible drives for student
// @route   GET /api/drives/student/eligible
router.get('/student/eligible', protect, authorize('student'), async (req, res) => {
    try {
        const student = req.user;
        const studentReputation = await Reputation.findOne({ studentId: student._id }) || { score: 0 };

        // Find open drives
        const drives = await RecruitmentDrive.find({ status: 'open' });

        // Check if student already applied
        const applications = await DriveApplication.find({ studentId: student._id });
        const appliedDriveIds = applications.map(a => a.driveId.toString());

        const eligibleDrives = drives.map(drive => {
            const isApplied = appliedDriveIds.includes(drive._id.toString());

            // Eligibility logic
            const criteria = drive.eligibilityCriteria;
            let isEligible = true;
            let reasons = [];

            if (criteria.minReputationScore > studentReputation.score) {
                isEligible = false;
                reasons.push(`Minimum reputation score of ${criteria.minReputationScore} required.`);
            }

            if (criteria.departments && criteria.departments.length > 0 && !criteria.departments.includes(student.department)) {
                isEligible = false;
                reasons.push(`Targeted for: ${criteria.departments.join(', ')}.`);
            }

            if (criteria.graduationYear && criteria.graduationYear !== student.academicYear) {
                isEligible = false;
                reasons.push(`Only for graduation year ${criteria.graduationYear}.`);
            }

            return {
                ...drive.toObject(),
                isEligible,
                reasons,
                isApplied
            };
        });

        res.json(eligibleDrives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Apply to a drive
// @route   POST /api/drives/:id/apply
router.post('/:id/apply', protect, authorize('student'), async (req, res) => {
    try {
        const drive = await RecruitmentDrive.findById(req.params.id);
        if (!drive) return res.status(404).json({ message: 'Drive not found' });
        if (drive.status !== 'open') return res.status(400).json({ message: 'Drive is closed' });

        // Basic eligibility check before applying
        const studentReputation = await Reputation.findOne({ studentId: req.user._id }) || { score: 0 };
        if (drive.eligibilityCriteria.minReputationScore > studentReputation.score) {
            return res.status(400).json({ message: 'Ineligible: Reputation score too low' });
        }

        const application = await DriveApplication.create({
            driveId: drive._id,
            studentId: req.user._id
        });
        res.status(201).json(application);
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Already applied to this drive' });
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get student's applications
// @route   GET /api/drives/student/my-applications
router.get('/student/my-applications', protect, authorize('student'), async (req, res) => {
    try {
        const applications = await DriveApplication.find({ studentId: req.user._id })
            .populate('driveId')
            .sort({ appliedAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- RECRUITER ROUTES ---

// @desc    Get recruiter's owned drives
// @route   GET /api/drives/recruiter/my
router.get('/recruiter/my', protect, authorize('recruiter'), async (req, res) => {
    try {
        const drives = await RecruitmentDrive.find({ recruiterEmail: req.user.email }).sort({ createdAt: -1 });
        res.json(drives);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all applications for recruiter's drives
// @route   GET /api/drives/recruiter/applications
router.get('/recruiter/applications', protect, authorize('recruiter'), async (req, res) => {
    try {
        const myDrives = await RecruitmentDrive.find({ recruiterEmail: req.user.email });
        const driveIds = myDrives.map(d => d._id);
        const applications = await DriveApplication.find({ driveId: { $in: driveIds } })
            .populate('studentId', 'name email')
            .populate('driveId', 'jobTitle')
            .sort({ appliedAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get specific application by drive and student (Recruiter only)
// @route   GET /api/drives/recruiter/applications/:driveId/:studentId
router.get('/recruiter/applications/:driveId/:studentId', protect, authorize('recruiter'), async (req, res) => {
    try {
        const application = await DriveApplication.findOne({
            driveId: req.params.driveId,
            studentId: req.params.studentId
        }).populate('driveId');

        if (!application) return res.status(404).json({ message: 'Application not found' });

        if (application.driveId.recruiterEmail !== req.user.email) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json(application);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get applicants for a specific drive (Recruiter or Admin)
// @route   GET /api/drives/:id/applicants
router.get('/:id/applicants', protect, authorize('recruiter', 'admin'), async (req, res) => {
    try {
        const drive = await RecruitmentDrive.findById(req.params.id);
        if (!drive) return res.status(404).json({ message: 'Drive not found' });

        // Security: Ensure recruiter owns this drive, or user is an admin
        if (req.user.role !== 'admin' && drive.recruiterEmail !== req.user.email) {
            return res.status(403).json({ message: 'Unauthorized: Access restricted to drive owner or admin' });
        }

        const applicants = await DriveApplication.find({ driveId: drive._id })
            .populate({
                path: 'studentId',
                select: 'name email university department academicYear enrollmentNumber'
            })
            .sort({ appliedAt: -1 });

        // Enrich with reputation scores
        const enrichedApplicants = await Promise.all(applicants.map(async (app) => {
            const reputation = await Reputation.findOne({ studentId: app.studentId._id }) || { score: 0 };
            return {
                ...app.toObject(),
                reputationScore: reputation.score
            };
        }));

        res.json(enrichedApplicants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update application status
// @route   PATCH /api/drives/applications/:appId/status
router.patch('/applications/:appId/status', protect, authorize('recruiter'), async (req, res) => {
    try {
        const { status } = req.body;
        if (!['shortlisted', 'rejected', 'hired', 'applied'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const application = await DriveApplication.findById(req.params.appId).populate('driveId');
        if (!application) return res.status(404).json({ message: 'Application not found' });

        // Security: Ensure recruiter owns the drive this application belongs to
        if (application.driveId.recruiterEmail !== req.user.email) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        application.status = status;
        await application.save();
        res.json(application);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
