const mongoose = require('mongoose');

const ReputationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    score: { type: Number, default: 0 },
    breakdown: {
        attendance: { type: Number, default: 0 },
        assignments: { type: Number, default: 0 },
        internships: { type: Number, default: 0 },
        certifications: { type: Number, default: 0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Reputation', ReputationSchema);
