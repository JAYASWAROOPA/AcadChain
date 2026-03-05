const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AllowedUser = require('../models/AllowedUser');
const AccessRequest = require('../models/AccessRequest');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Check if email is whitelisted or exists
// @route   POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.json({ exists: true, role: user.role });
        }

        const allowed = await AllowedUser.findOne({ email });
        if (allowed) {
            return res.json({
                exists: false,
                whitelisted: true,
                role: allowed.role,
                university: allowed.university,
                department: allowed.department,
                academicYear: allowed.academicYear
            });
        }

        res.json({ exists: false, whitelisted: false });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Setup password for whitelisted users (First-time login)
// @route   POST /api/auth/setup-password
router.post('/setup-password', async (req, res) => {
    const { email, password, name, university, department, academicYear, enrollmentNumber } = req.body;
    try {
        const allowed = await AllowedUser.findOne({ email });
        if (!allowed) {
            return res.status(403).json({ message: 'Email not whitelisted. Access denied.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Account already setup. Please login.' });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: allowed.role,
            university: university || allowed.university,
            department: department || allowed.department,
            academicYear: academicYear || allowed.academicYear,
            enrollmentNumber
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Request access for unauthorized emails
// @route   POST /api/auth/request-access
router.post('/request-access', async (req, res) => {
    const { email, requestedRole, name, companyName, website, linkedin, reason } = req.body;
    try {
        const existingRequest = await AccessRequest.findOne({ email, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'Access request already pending for this email.' });
        }

        await AccessRequest.create({
            email,
            requestedRole,
            name, // Note: Added name to schema if needed, but schema didn't have it. Let's assume reason/role is enough or add it.
            companyName,
            website,
            linkedin,
            reason
        });

        res.status(201).json({ message: 'Access request sent to admin' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.comparePassword(password))) {
            if (user.accountStatus === 'inactive' || user.accountStatus === 'suspended') {
                return res.status(403).json({ message: 'Account is disabled. Contact admin.' });
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            // Check if whitelisted but not setup
            const allowed = await AllowedUser.findOne({ email });
            if (allowed) {
                return res.status(401).json({
                    message: 'Account not setup. Please use the setup flow.',
                    setupRequired: true
                });
            }
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
