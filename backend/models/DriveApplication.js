const mongoose = require('mongoose');

const DriveApplicationSchema = new mongoose.Schema({
    driveId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentDrive', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appliedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'rejected', 'hired'],
        default: 'applied'
    }
}, { timestamps: true });

// Ensure a student can only apply once to a specific drive
DriveApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('DriveApplication', DriveApplicationSchema);
