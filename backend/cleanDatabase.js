const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const AcademicRecord = require('./models/AcademicRecord');
const Reputation = require('./models/Reputation');
const AllowedUser = require('./models/AllowedUser');
const AccessRequest = require('./models/AccessRequest');
const RecruitmentDrive = require('./models/RecruitmentDrive');
const DriveApplication = require('./models/DriveApplication');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';

const cleanDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected...');

        // Keep this admin account
        const adminEmail = 'admin@uni.edu';
        const admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            console.log('Admin account not found. Creating new admin...');
            await User.create({
                name: 'System Admin',
                email: adminEmail,
                password: 'admin123',
                role: 'admin'
            });
            console.log('✅ Admin account created: admin@uni.edu');
        } else {
            console.log(`✅ Keeping admin account: ${adminEmail}`);
        }

        // Delete all users except admin
        const deletedUsers = await User.deleteMany({ email: { $ne: adminEmail } });
        console.log(`🗑️  Deleted ${deletedUsers.deletedCount} users`);

        // Delete all academic records
        const deletedRecords = await AcademicRecord.deleteMany({});
        console.log(`🗑️  Deleted ${deletedRecords.deletedCount} academic records`);

        // Delete all reputations
        const deletedReputations = await Reputation.deleteMany({});
        console.log(`🗑️  Deleted ${deletedReputations.deletedCount} reputation records`);

        // Delete all allowed users
        const deletedAllowed = await AllowedUser.deleteMany({});
        console.log(`🗑️  Deleted ${deletedAllowed.deletedCount} allowed users`);

        // Delete all access requests
        const deletedRequests = await AccessRequest.deleteMany({});
        console.log(`🗑️  Deleted ${deletedRequests.deletedCount} access requests`);

        // Delete all recruitment drives
        const deletedDrives = await RecruitmentDrive.deleteMany({});
        console.log(`🗑️  Deleted ${deletedDrives.deletedCount} recruitment drives`);

        // Delete all drive applications
        const deletedApplications = await DriveApplication.deleteMany({});
        console.log(`🗑️  Deleted ${deletedApplications.deletedCount} drive applications`);

        console.log('\n✅ Database cleanup complete!');
        console.log('═══════════════════════════════════');
        console.log(`Only admin account remains: ${adminEmail}`);
        console.log('Password: admin123');
        console.log('═══════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

cleanDatabase();
