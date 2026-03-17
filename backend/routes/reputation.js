const express = require('express');
const router = express.Router();
const AcademicRecord = require('../models/AcademicRecord');
const Reputation = require('../models/Reputation');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get student reputation score
// @route   GET /api/reputation/:studentId
// @desc    Search student reputation and records
// @route   GET /api/reputation/search
router.get('/search', async (req, res) => {
    const { email, university, year, minScore, department } = req.query;
    try {
        let query = { role: 'student' };
        if (email) query.email = new RegExp(email, 'i');
        if (university) query.university = new RegExp(university, 'i');
        if (year) query.academicYear = year;
        if (department) query.department = new RegExp(department, 'i');

        const students = await User.find(query).select('-password');

        const results = await Promise.all(students.map(async (student) => {
            const reputation = await Reputation.findOne({ studentId: student._id }) || { score: 0, breakdown: {} };
            const verifiedRecords = await AcademicRecord.find({ studentId: student._id, status: 'verified' });

            return {
                student,
                reputation,
                recordCount: verifiedRecords.length
            };
        }));

        // Filter by minScore if provided
        const finalResults = minScore
            ? results.filter(r => r.reputation.score >= parseFloat(minScore))
            : results;

        res.json(finalResults);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get detailed reputation report for recruiter
// @route   GET /api/reputation/report/:id
router.get('/report/:id', async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const reputation = await Reputation.findOne({ studentId: student._id }) || { score: 0, breakdown: {} };
        const verifiedRecords = await AcademicRecord.find({ studentId: student._id, status: 'verified' })
            .populate('verifiedBy', 'name email');

        res.json({
            student,
            reputation,
            verifiedRecords
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get student reputation score (and update it)
// @route   GET /api/reputation/:studentId
router.get('/:studentId', async (req, res) => {
    try {
        const verifiedRecords = await AcademicRecord.find({
            studentId: req.params.studentId,
            status: 'verified'
        });

        // Algorithm:
        // Score = (Attendance * 0.3) + (Assignments * 0.3) + (Internships * 0.2) + (Certifications * 0.2)
        let attendance = 0, assignments = 0, internships = 0, certifications = 0;

        verifiedRecords.forEach(rec => {
            const val = parseFloat(rec.data) || 10;
            if (rec.type === 'attendance') attendance = Math.max(attendance, val);
            if (rec.type === 'assignment') assignments += 10;
            if (rec.type === 'internship') internships += 20;
            if (rec.type === 'certification') certifications += 20;
            if (rec.type === 'workshop') certifications += 5;
        });

        // Cap each component at 100 so the weighted average is out of 100
        attendance = Math.min(100, attendance);
        assignments = Math.min(100, assignments);
        internships = Math.min(100, internships);
        certifications = Math.min(100, certifications);

        const score = (attendance * 0.3) + (assignments * 0.3) + (internships * 0.2) + (certifications * 0.2);

        const reputation = await Reputation.findOneAndUpdate(
            { studentId: req.params.studentId },
            {
                score,
                breakdown: { attendance, assignments, internships, certifications }
            },
            { upsert: true, new: true }
        );

        res.json(reputation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
