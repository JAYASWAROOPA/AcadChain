const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    requestedRole: {
        type: String,
        enum: ['student', 'faculty', 'recruiter'],
        required: true
    },
    name: {
        type: String,
        required: true
    },
    companyName: String,
    website: String,
    linkedin: String,
    reason: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('AccessRequest', AccessRequestSchema);
