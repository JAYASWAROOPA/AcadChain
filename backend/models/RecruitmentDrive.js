const mongoose = require('mongoose');

const RecruitmentDriveSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    role: { type: String, required: true },
    description: { type: String, required: true },
    minReputation: { type: Number, required: true },
    eligibleDepartments: [{ type: String }],
    eligibleYear: [{ type: String }],
    lastDate: { type: Date, required: true },
    hiringType: { type: String }, // Internship / Full-time
    package: { type: String },
    location: { type: String },
    recruiterEmail: { type: String }, // Optional to link explicitly to a recruiter if needed
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('RecruitmentDrive', RecruitmentDriveSchema);
