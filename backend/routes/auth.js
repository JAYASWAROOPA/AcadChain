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

    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        console.log(`Checking email: ${normalizedEmail}`);

        const user = await User.findOne({ email: normalizedEmail }).select('role');
        if (user) {
            console.log(`User found: ${normalizedEmail}, role: ${user.role}`);
            return res.json({ exists: true, role: user.role });
        }

        const allowed = await AllowedUser.findOne({ email: normalizedEmail }).select('role university department academicYear');
        if (allowed) {
            console.log(`Whitelisted user found: ${normalizedEmail}, role: ${allowed.role}`);
            return res.json({
                exists: false,
                whitelisted: true,
                role: allowed.role,
                university: allowed.university,
                department: allowed.department,
                academicYear: allowed.academicYear
            });
        }

        console.log(`Email not found: ${normalizedEmail}`);
        res.json({ exists: false, whitelisted: false });
    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({ message: 'Server error during verification' });
    }
});
        res.status(500).json({ message: error.message });
    }
});

// @desc    Setup password for whitelisted users (First-time login)
// @route   POST /api/auth/setup-password
router.post('/setup-password', async (req, res) => {
    const { email, password, name, university, department, academicYear, enrollmentNumber, mentorId } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    try {
        const allowed = await AllowedUser.findOne({ email: normalizedEmail });
        if (!allowed) {
            return res.status(403).json({ message: 'Email not whitelisted. Access denied.' });
        }

        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'Account already setup. Please login.' });
        }

        // Mentor validation for students
        if (allowed.role === 'student') {
            if (!mentorId) {
                return res.status(400).json({ message: 'Mentor selection is required for students.' });
            }
            const mentor = await User.findById(mentorId);
            if (!mentor || mentor.role !== 'faculty') {
                return res.status(400).json({ message: 'Invalid mentor selected.' });
            }
        }

        const userData = {
            name,
            email,
            password,
            role: allowed.role,
            university: university || allowed.university,
            department: department || allowed.department,
            academicYear: academicYear || allowed.academicYear,
            enrollmentNumber
        };

        if (allowed.role === 'student') {
            userData.mentor = mentorId;
        }

        const user = new User(userData);
        await user.save();

        if (allowed.role === 'student') {
            try {
                await User.findByIdAndUpdate(mentorId, { $push: { mentees: user._id } });
            } catch (err) {
                await User.findByIdAndDelete(user._id);
                throw new Error('Failed to associate mentor. Please try again.');
            }
        }

        const populatedUser = await User.findById(user._id).populate('mentor', 'name email');
        const mentorInfo = populatedUser.mentor ? { name: populatedUser.mentor.name, email: populatedUser.mentor.email } : null;

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mentor: mentorInfo,
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
    const normalizedEmail = email.toLowerCase().trim();
    try {
        const existingRequest = await AccessRequest.findOne({ email: normalizedEmail, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ message: 'Access request already pending for this email.' });
        }

        await AccessRequest.create({
            email: normalizedEmail,
            requestedRole,
            name,
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

// @desc    Get all faculty members
// @route   GET /api/auth/faculty
router.get('/faculty', async (req, res) => {
    try {
        const faculty = await User.find({ role: 'faculty' })
            .select('_id name email department university')
            .exec();
        res.json(faculty);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    try {
        const user = await User.findOne({ email: normalizedEmail });
        if (user && (await user.comparePassword(password))) {
            if (user.accountStatus === 'inactive' || user.accountStatus === 'suspended') {
                return res.status(403).json({ message: 'Account is disabled. Contact admin.' });
            }

            const populatedUser = await User.findById(user._id).populate('mentor', 'name email');
            const mentorInfo = populatedUser.mentor ? { name: populatedUser.mentor.name, email: populatedUser.mentor.email } : null;

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                mentor: mentorInfo,
                token: generateToken(user._id),
            });
        } else {
            // Check if whitelisted but not setup
            const allowed = await AllowedUser.findOne({ email: normalizedEmail });
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
