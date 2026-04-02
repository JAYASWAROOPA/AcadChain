const mongoose = require('mongoose');

const MentorRemarkSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['feedback', 'warning', 'praise', 'suggestion'], required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    isPrivate: { type: Boolean, default: false }, // If true, only visible to mentor and admin
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

// Index for efficient queries
MentorRemarkSchema.index({ studentId: 1, createdAt: -1 });

module.exports = mongoose.model('MentorRemark', MentorRemarkSchema);