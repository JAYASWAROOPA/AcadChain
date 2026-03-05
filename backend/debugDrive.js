const mongoose = require('mongoose');
const RecruitmentDrive = require('./models/RecruitmentDrive');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';

const testCreateDrive = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const driveData = {
            companyName: 'Zoho',
            jobTitle: 'Software developer',
            recruiterEmail: 'hr@company.com',
            jobDescription: 'Join',
            applicationStartDate: '2026-02-13',
            applicationEndDate: '2026-02-15',
            minReputationScore: '80',
            departments: 'ECE',
            graduationYear: '2027',
            eligibilityCriteria: {
                departments: ['ECE'],
                minReputationScore: 80,
                graduationYear: '2027'
            }
        };

        const drive = new RecruitmentDrive(driveData);
        await drive.validate();
        console.log('Validation successful');

        // Try to save (just as a test, we can delete it later or just not save)
        // const saved = await drive.save();
        // console.log('Saved successfully:', saved._id);

        process.exit(0);
    } catch (error) {
        console.error('Validation Error Details:');
        if (error.errors) {
            Object.keys(error.errors).forEach(key => {
                console.error(`${key}: ${error.errors[key].message}`);
            });
        } else {
            console.error(error.message);
        }
        process.exit(1);
    }
};

testCreateDrive();
