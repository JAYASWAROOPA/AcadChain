const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const AllowedUser = require('./models/AllowedUser');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected for seeding...');

        const usersToWhitelist = [
            { email: 'admin@uni.edu', role: 'admin' },
            { email: 'student1@uni.edu', role: 'student' },
            { email: 'faculty1@uni.edu', role: 'faculty' },
            { email: 'recruiter1@company.com', role: 'recruiter' },
            { email: 'hr@company.com', role: 'recruiter' }
        ];

        for (const u of usersToWhitelist) {
            const exists = await AllowedUser.findOne({ email: u.email });
            if (!exists) {
                await AllowedUser.create({
                    email: u.email,
                    role: u.role
                    // addedByAdminId is now optional
                });
                console.log(`Whitelisted: ${u.email} (${u.role})`);
            } else {
                console.log(`Already whitelisted: ${u.email}`);
            }
        }

        console.log('Seeding completed.');
        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
