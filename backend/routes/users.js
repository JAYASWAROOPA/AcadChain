const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const Reputation = require('../models/Reputation');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get current user profile (with mentor details if student)
// @route   GET /api/users/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password').populate('mentorId', 'name email');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const mentor = user.mentorId ? { _id: user.mentorId._id, name: user.mentorId.name, email: user.mentorId.email } : null;

        res.json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                university: user.university,
                department: user.department,
                enrollmentNumber: user.enrollmentNumber,
                academicYear: user.academicYear,
                accountStatus: user.accountStatus,
                mentor
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all users
// @route   GET /api/users
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc Assign mentor to student by email
// @route POST /api/users/assign-mentor
router.post('/assign-mentor', protect, authorize('admin'), async (req, res) => {
    try {
        const { studentEmail, mentorEmail } = req.body;

        const student = await User.findOne({ email: studentEmail, role: 'student' });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const mentor = await User.findOne({ email: mentorEmail, role: 'faculty' });
        if (!mentor) return res.status(404).json({ message: 'Faculty mentor not found' });

        student.mentorId = mentor._id;
        await student.save();

        res.json({
            message: `Mentor assigned: ${mentor.email} -> ${student.email}`,
            student: { email: student.email, name: student.name, mentorId: mentor._id },
            mentor: { email: mentor.email, name: mentor.name }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ============= FACULTY MENTOR ENDPOINTS (BEFORE GENERIC :id ROUTES) =============

// @desc    Get all students assigned to a faculty member
// @route   GET /api/users/faculty/my-students
router.get('/faculty/my-students', protect, authorize('faculty'), async (req, res) => {
    try {
        const facultyId = req.user._id;
        const { search, department } = req.query;

        // Build filter for students
        let filter = { mentorId: facultyId, role: 'student' };
        if (search) {
            filter.name = { $regex: search, $options: 'i' }; // Case-insensitive search
        }
        if (department) {
            filter.department = department;
        }

        const students = await User.find(filter)
            .select('_id name email department university academicYear enrollmentNumber')
            .exec();

        // Get metrics for each student
        const studentsWithMetrics = await Promise.all(
            students.map(async (student) => {
                const reputation = await Reputation.findOne({ studentId: student._id });
                const records = await AcademicRecord.find({ studentId: student._id });

                const approved = records.filter(r => r.status === 'verified').length;
                const pending = records.filter(r => r.status === 'pending').length;
                const rejected = records.filter(r => r.status === 'rejected').length;

                return {
                    ...student.toObject(),
                    reputation: reputation?.score || 0,
                    submissions: {
                        approved,
                        pending,
                        rejected,
                        total: records.length
                    },
                    status: (reputation?.score || 0) < 50 || rejected > 2 ? 'Needs Attention' : 'Active'
                };
            })
        );

        res.json(studentsWithMetrics);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get detailed information about a specific student
// @route   GET /api/users/faculty/student-detail/:studentId
router.get('/faculty/student-detail/:studentId', protect, authorize('faculty'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const facultyId = req.user._id;

        // Verify the student is assigned to this faculty
        const student = await User.findOne({ _id: studentId, mentorId: facultyId, role: 'student' });
        if (!student) {
            return res.status(403).json({ message: 'Unauthorized. Student not assigned to you.' });
        }

        // Get reputation data
        const reputation = await Reputation.findOne({ studentId });

        // Get all academic records
        const records = await AcademicRecord.find({ studentId })
            .sort({ createdAt: -1 })
            .exec();

        // Group records by type
        const recordsByType = {
            internships: records.filter(r => r.type === 'internship'),
            certifications: records.filter(r => r.type === 'certification'),
            assignments: records.filter(r => r.type === 'assignment'),
            workshops: records.filter(r => r.type === 'workshop'),
            attendance: records.filter(r => r.type === 'attendance')
        };

        // Calculate statistics
        const stats = {
            total: records.length,
            approved: records.filter(r => r.status === 'verified').length,
            pending: records.filter(r => r.status === 'pending').length,
            rejected: records.filter(r => r.status === 'rejected').length,
            rejectionRate: records.length > 0 
                ? ((records.filter(r => r.status === 'rejected').length / records.length) * 100).toFixed(2)
                : 0
        };

        // Prepare achievements
        const achievements = {
            internships: recordsByType.internships.map(r => ({
                _id: r._id,
                organization: r.organization,
                role: r.role,
                duration: r.duration,
                issueDate: r.issueDate,
                status: r.status,
                description: r.description
            })),
            certifications: recordsByType.certifications.map(r => ({
                _id: r._id,
                issuer: r.issuer,
                certificateId: r.certificateId,
                issueDate: r.issueDate,
                status: r.status,
                description: r.description
            }))
        };

        // Mentor alerts/insights
        const alerts = [];
        if ((reputation?.score || 0) < 50) {
            alerts.push('Low reputation score - may need guidance');
        }
        if (stats.rejectionRate > 30) {
            alerts.push('High rejection rate - review submission quality');
        }
        if (stats.total === 0) {
            alerts.push('No submissions yet - encourage student to submit');
        }

        res.json({
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
                department: student.department,
                university: student.university,
                academicYear: student.academicYear,
                enrollmentNumber: student.enrollmentNumber
            },
            reputation: {
                score: reputation?.score || 0,
                breakdown: reputation?.breakdown || {
                    attendance: 0,
                    assignments: 0,
                    internships: 0,
                    certifications: 0
                }
            },
            statistics: stats,
            achievements,
            allRecords: records,
            mentorAlerts: alerts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Cascade delete: Records and Reputation for this user
        await AcademicRecord.deleteMany({ studentId: req.params.id });
        await Reputation.findOneAndDelete({ studentId: req.params.id });
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User and all associated data deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update user profile (Self)
// @route   PATCH /api/users/profile
router.patch('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = req.body.name || user.name;
        user.university = req.body.university || user.university;
        user.department = req.body.department || user.department;
        user.enrollmentNumber = req.body.enrollmentNumber || user.enrollmentNumber;
        user.academicYear = req.body.academicYear || user.academicYear;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            university: updatedUser.university,
            department: updatedUser.department,
            enrollmentNumber: updatedUser.enrollmentNumber,
            academicYear: updatedUser.academicYear
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Disable/Enable user (Admin)
// @route   PATCH /api/users/:id/disable
router.patch('/:id/disable', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.accountStatus = user.accountStatus === 'active' ? 'inactive' : 'active';
        await user.save();
        res.json({ message: `User ${user.accountStatus}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Change user role (Admin)
// @route   PATCH /api/users/:id/role
router.patch('/:id/role', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.role) {
            user.role = req.body.role;
            await user.save();
            res.json({ message: `User role updated to ${user.role}` });
        } else {
            res.status(400).json({ message: 'Role is required' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
