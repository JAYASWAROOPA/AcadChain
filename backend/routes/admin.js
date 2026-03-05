const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AcademicRecord = require('../models/AcademicRecord');
const AllowedUser = require('../models/AllowedUser');
const AccessRequest = require('../models/AccessRequest');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get system dashboard stats
// @route   GET /api/admin/stats
router.get('/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const students = await User.countDocuments({ role: 'student' });
        const faculty = await User.countDocuments({ role: 'faculty' });
        const recruiters = await User.countDocuments({ role: 'recruiter' });

        const totalRecords = await AcademicRecord.countDocuments();
        const verifiedRecords = await AcademicRecord.countDocuments({ status: 'verified' });
        const pendingRecords = await AcademicRecord.countDocuments({ status: 'pending' });

        const pendingRequests = await AccessRequest.countDocuments({ status: 'pending' });

        res.json({
            users: { total: totalUsers, students, faculty, recruiters },
            records: { total: totalRecords, verified: verifiedRecords, pending: pendingRecords },
            pendingRequests
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all whitelisted users
// @route   GET /api/admin/whitelist
router.get('/whitelist', protect, authorize('admin'), async (req, res) => {
    try {
        const whitelist = await AllowedUser.find().populate('addedByAdminId', 'name email');
        res.json(whitelist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Add to whitelist
router.post('/whitelist', protect, authorize('admin'), async (req, res) => {
    const { email, role, university, department, academicYear } = req.body;
    try {
        const exists = await AllowedUser.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already whitelisted' });

        // Optional: Student domain check
        if (role === 'student' && !email.toLowerCase().endsWith('.edu')) {
            return res.status(400).json({ message: 'Students must have a university (.edu) email' });
        }

        const allowedUser = await AllowedUser.create({
            email,
            role,
            university,
            department,
            academicYear,
            addedByAdminId: req.user._id
        });
        res.status(201).json(allowedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Remove from whitelist
// @route   DELETE /api/admin/whitelist/:id
router.delete('/whitelist/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const allowedUser = await AllowedUser.findById(req.params.id);
        if (!allowedUser) return res.status(404).json({ message: 'Not found' });

        await allowedUser.deleteOne();
        res.json({ message: 'Removed from whitelist' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all access requests
// @route   GET /api/admin/access-requests
router.get('/access-requests', protect, authorize('admin'), async (req, res) => {
    try {
        const requests = await AccessRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve access request
// @route   POST /api/admin/access-requests/:id/approve
router.post('/access-requests/:id/approve', protect, authorize('admin'), async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Add to whitelist
        await AllowedUser.create({
            email: request.email,
            role: request.requestedRole,
            addedByAdminId: req.user._id
        });

        request.status = 'approved';
        await request.save();

        res.json({ message: 'Request approved and whitelisted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Reject access request
// @route   POST /api/admin/access-requests/:id/reject
router.post('/access-requests/:id/reject', protect, authorize('admin'), async (req, res) => {
    try {
        const request = await AccessRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Request rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
