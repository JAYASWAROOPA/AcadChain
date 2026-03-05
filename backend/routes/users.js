const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

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
