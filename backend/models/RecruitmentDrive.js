const mongoose = require('mongoose');

const RecruitmentDriveSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    companyLogo: { type: String }, // URL or path
    recruiterEmail: { type: String, required: true }, // Links to the recruiter
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    eligibilityCriteria: {
        departments: [{ type: String }],
        minReputationScore: { type: Number, default: 0 },
        graduationYear: { type: String }
    },
    applicationStartDate: { type: Date, required: true },
    applicationEndDate: { type: Date, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('RecruitmentDrive', RecruitmentDriveSchema);
