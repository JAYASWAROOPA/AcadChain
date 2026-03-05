const mongoose = require('mongoose');

const AcademicRecordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['attendance', 'assignment', 'internship', 'certification', 'workshop'], required: true },

    // Common Fields
    semester: { type: String }, // e.g. "Sem 5"
    department: { type: String },
    subject: { type: String }, // Course / Subject Name

    // Performance Data (Conditional based on type)
    data: { type: String, required: true }, // Main value (Percentage, Grade, etc.)
    maxScore: { type: String }, // e.g., "100" or "A+"

    // Assignments/Internships/Certs specific
    submissionDate: { type: Date },
    organization: { type: String }, // for Internship/Cert
    role: { type: String }, // Internship Role
    duration: { type: String }, // Weeks/Hours
    mode: { type: String, enum: ['online', 'offline', 'hybrid'] },
    issuer: { type: String }, // Cert Authority
    issueDate: { type: Date },
    certificateId: { type: String },

    // Proof
    proofFile: { type: String }, // Stored file path (relative)
    proofOriginalName: { type: String }, // Original filename
    referenceUrl: { type: String },
    description: { type: String },

    // Verification
    hash: { type: String, required: true }, // SHA-256 hash of critical data
    status: { type: String, enum: ['draft', 'pending', 'verified', 'rejected', 'withdrawn'], default: 'pending' },
    isLocked: { type: Boolean, default: false }, // Immutable after verification
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    blockchainTx: { type: String }, // Transaction hash
    rejectionReason: { type: String },
    facultyComment: { type: String },

    timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('AcademicRecord', AcademicRecordSchema);
