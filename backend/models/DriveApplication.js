const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recruitmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentDrive', required: true },
    status: {
        type: String,
        enum: ['applied', 'shortlisted', 'rejected', 'hired'],
        default: 'applied'
    },
    appliedDate: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure a student can only apply once to a specific drive
ApplicationSchema.index({ recruitmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);
