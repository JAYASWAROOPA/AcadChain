const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'faculty', 'admin', 'recruiter'], required: true },
    university: { type: String },
    department: { type: String },
    enrollmentNumber: { type: String },
    academicYear: { type: String }, // e.g., "3rd Year"
    accountStatus: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
    mentor: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: function() { return this.role === 'student'; }
    },
    mentees: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
        throw error;
    }
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
