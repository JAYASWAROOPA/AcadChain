const mongoose = require('mongoose');

const AllowedUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'recruiter', 'admin'],
        required: true
    },
    addedByAdminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    university: { type: String },
    department: { type: String },
    academicYear: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('AllowedUser', AllowedUserSchema);
