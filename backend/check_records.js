const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const AcademicRecord = require('./models/AcademicRecord');
const User = require('./models/User');

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkRecords() {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';
        await mongoose.connect(MONGO_URI);

        console.log('Checking AcademicRecord documents...');

        const records = await AcademicRecord.find({}).limit(5);
        console.log(`Found ${records.length} records`);

        for (const record of records) {
            console.log(`Record ID: ${record._id}`);
            console.log(`VerifiedBy: ${record.verifiedBy}`);
            if (record.verifiedBy) {
                const user = await User.findById(record.verifiedBy);
                console.log(`User exists: ${!!user}`);
                if (user) {
                    console.log(`User name: ${user.name}`);
                } else {
                    console.log(`❌ User with ID ${record.verifiedBy} does not exist!`);
                }
            }
            console.log('---');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkRecords();