const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const AcademicRecord = require('../models/AcademicRecord');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// @desc    Student upload record (Submit for approval)
// @route   POST /api/records/upload
router.post('/upload', protect, authorize('student'), upload.single('proofFile'), async (req, res) => {
    const {
        type, data, semester, department, subject, maxScore,
        submissionDate, organization, role, duration, mode,
        issuer, issueDate, certificateId, description
    } = req.body;

    try {
        console.log('POST /upload - Body:', req.body);
        console.log('POST /upload - File:', req.file);

        if (!req.file) {
            console.log('Upload failed: No file provided');
            return res.status(400).json({ message: 'Proof file is required for submission' });
        }

        // Initial hash of the submission content (for integrity)
        const contentHash = crypto.createHash('sha256').update(JSON.stringify({
            type, data, studentId: req.user._id, originalName: req.file.originalname
        })).digest('hex');

        const record = await AcademicRecord.create({
            studentId: req.user._id,
            type, data, hash: contentHash, status: 'pending',
            semester, department, subject, maxScore,
            submissionDate, organization, role, duration, mode,
            issuer, issueDate, certificateId,
            proofFile: req.file.path,
            proofOriginalName: req.file.originalname,
            description
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Student save record as draft
// @route   POST /api/records/draft
router.post('/draft', protect, authorize('student'), upload.single('proofFile'), async (req, res) => {
    const {
        type, data, semester, department, subject, maxScore,
        submissionDate, organization, role, duration, mode,
        issuer, issueDate, certificateId, description
    } = req.body;

    try {
        const contentHash = crypto.createHash('sha256').update(JSON.stringify({
            type, data, studentId: req.user._id, timestamp: Date.now()
        })).digest('hex');

        const recordData = {
            studentId: req.user._id,
            type, data, hash: contentHash, status: 'draft',
            semester, department, subject, maxScore,
            submissionDate, organization, role, duration, mode,
            issuer, issueDate, certificateId,
            description
        };

        if (req.file) {
            recordData.proofFile = req.file.path;
            recordData.proofOriginalName = req.file.originalname;
        }

        const record = await AcademicRecord.create(recordData);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get student's own records
// @route   GET /api/records/my
router.get('/my', protect, authorize('student'), async (req, res) => {
    try {
        const records = await AcademicRecord.find({ studentId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get protected proof file
// @route   GET /api/records/file/:id
router.get('/file/:id', protect, async (req, res) => {
    try {
        const record = await AcademicRecord.findById(req.params.id);
        if (!record) return res.status(404).json({ message: 'Record not found' });

        // Access Control: Student owner, Faculty, or Recruiter (if verified)
        const isOwner = record.studentId.toString() === req.user._id.toString();
        const isFaculty = req.user.role === 'faculty';
        const isRecruiterAndVerified = req.user.role === 'recruiter' && record.status === 'verified';
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isFaculty && !isRecruiterAndVerified && !isAdmin) {
            return res.status(403).json({ message: 'Access denied to this file' });
        }

        if (!record.proofFile || !fs.existsSync(record.proofFile)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        res.sendFile(path.resolve(record.proofFile));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Faculty view pending records
// @route   GET /api/records/pending
router.get('/pending', protect, authorize('faculty'), async (req, res) => {
    try {
        const records = await AcademicRecord.find({ status: 'pending' })
            .populate('studentId', 'name email department academicYear')
            .sort({ createdAt: 1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Faculty view verification history
// @route   GET /api/records/history
router.get('/history', protect, authorize('faculty'), async (req, res) => {
    try {
        const records = await AcademicRecord.find({ verifiedBy: req.user._id })
            .populate('studentId', 'name email')
            .sort({ updatedAt: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get single record for review
// @route   GET /api/records/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const record = await AcademicRecord.findById(req.params.id).populate('studentId', 'name email department academicYear');
        if (!record) return res.status(404).json({ message: 'Record not found' });

        // Check if user is allowed to view this record
        if (req.user.role === 'student' && record.studentId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/verify/:id', protect, authorize('faculty'), async (req, res) => {
    const { status, remarks, rejectionReason } = req.body;

    // Trim and validate remarks
    const cleanRemarks = remarks ? remarks.trim() : '';

    if (!cleanRemarks) {
        return res.status(400).json({ message: 'Decision remarks are mandatory' });
    }

    try {
        console.log(`[VERIFY] Start processing. ID: ${req.params.id}, Status: ${status}`);
        const record = await AcademicRecord.findById(req.params.id);
        if (!record) {
            console.log('[VERIFY] Record not found');
            return res.status(404).json({ message: 'Record not found' });
        }
        console.log(`[VERIFY] Found record: ${record.type} for student ${record.studentId}`);

        if (record.isLocked) {
            return res.status(400).json({ message: 'Record is already processed and locked' });
        }

        // Apply shared fields
        record.status = status;
        record.verifiedBy = req.user._id;
        record.facultyComment = cleanRemarks;

        if (status === 'verified') {
            const timestamp = Date.now();
            // Create a robust payload for the blockchain simulation
            const hashPayload = [
                record.studentId.toString(),
                record.type,
                record.data,
                req.user._id.toString(),
                timestamp
            ].join('|');

            record.blockchainTx = crypto.createHash('sha256').update(hashPayload).digest('hex');
            record.isLocked = true;
            console.log(`Record ${record._id} verified and locked with hash: ${record.blockchainTx.substring(0, 10)}...`);
        } else if (status === 'rejected') {
            if (!rejectionReason) {
                return res.status(400).json({ message: 'Rejection category/reason is required' });
            }
            record.rejectionReason = rejectionReason;
            record.isLocked = true;
            console.log(`Record ${record._id} rejected and locked. Reason: ${rejectionReason}`);
        } else {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        await record.save();
        res.json(record);
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ message: error.message || 'Error processing verification' });
    }
});

// @desc    Student withdraw record
// @route   PATCH /api/records/:id/withdraw
router.patch('/:id/withdraw', protect, authorize('student'), async (req, res) => {
    try {
        const record = await AcademicRecord.findOne({ _id: req.params.id, studentId: req.user._id });
        if (!record) return res.status(404).json({ message: 'Record not found' });

        if (record.isLocked) {
            return res.status(400).json({ message: 'Cannot withdraw verified or rejected records' });
        }

        record.status = 'withdrawn';
        await record.save();
        res.json({ message: 'Record withdrawn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Student delete record
// @route   DELETE /api/records/:id
router.delete('/:id', protect, authorize('student'), async (req, res) => {
    try {
        const record = await AcademicRecord.findOne({ _id: req.params.id, studentId: req.user._id });
        if (!record) return res.status(404).json({ message: 'Record not found' });

        if (record.isLocked) {
            return res.status(400).json({ message: 'Cannot delete processed records' });
        }

        // Delete associated file if it exists
        if (record.proofFile && fs.existsSync(record.proofFile)) {
            fs.unlinkSync(record.proofFile);
        }

        await AcademicRecord.deleteOne({ _id: record._id });
        res.json({ message: 'Record deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
