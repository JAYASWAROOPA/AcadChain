const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';

const setPassword = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected...');

        const email = 'admin@uni.edu';
        const newPassword = 'admin';

        let user = await User.findOne({ email });

        if (user) {
            user.password = newPassword;
            await user.save();
            console.log(`Password updated for user: ${email}`);
        } else {
            user = await User.create({
                name: 'System Admin',
                email: email,
                password: newPassword,
                role: 'admin'
            });
            console.log(`User created and password set for: ${email}`);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

setPassword();
