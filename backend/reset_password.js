const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function resetAdminPassword() {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';
        await mongoose.connect(MONGO_URI);

        console.log('Resetting admin password...');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const result = await User.updateOne(
            { email: 'admin@uni.edu' },
            { password: hashedPassword }
        );

        console.log('Password reset result:', result);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

resetAdminPassword();