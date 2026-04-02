const mongoose = require('mongoose');
const User = require('./models/User');
const AllowedUser = require('./models/AllowedUser');
const dotenv = require('dotenv');
dotenv.config();

async function runTests() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0');
    console.log('Connected to DB');

    const testFacultyEmail = `test_faculty_${Date.now()}@univ.edu`;
    const testStudentEmail = `test_student_${Date.now()}@univ.edu`;

    // 1. Whitelist them
    await AllowedUser.create({ email: testFacultyEmail, role: 'faculty' });
    await AllowedUser.create({ email: testStudentEmail, role: 'student' });
    console.log('Whitelisted test users');

    // 2. Setup Faculty
    const fRes = await fetch('http://localhost:5000/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testFacultyEmail, password: 'password123', name: 'Dr. Test Mentor' })
    });
    const faculty = await fRes.json();
    console.log('Faculty registered:', faculty.email);

    // 3. Test API /users/mentors
    const mRes = await fetch('http://localhost:5000/api/users/mentors');
    if (!mRes.ok) {
        console.error('Error in /mentors:', mRes.status, await mRes.text());
        return;
    }
    const mentors = await mRes.json();
    console.log(`Found ${mentors.length} mentors. Is our test faculty there?`, mentors.some(m => m._id === faculty._id));

    // 4. Setup Student with Mentor
    const sRes = await fetch('http://localhost:5000/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email: testStudentEmail, password: 'password123', name: 'Test Student', mentorId: faculty._id 
        })
    });
    const student = await sRes.json();
    console.log('Student registered:', student.email);

    // 5. Test API /users/mentees
    const aRes = await fetch('http://localhost:5000/api/users/mentees', {
        headers: { 'Authorization': `Bearer ${faculty.token}` }
    });
    const mentees = await aRes.json();
    console.log(`Mentee list for faculty:`, mentees.map(m => m.name));

    // Cleanup
    await User.deleteMany({ email: { $in: [testFacultyEmail, testStudentEmail] } });
    await AllowedUser.deleteMany({ email: { $in: [testFacultyEmail, testStudentEmail] } });
    console.log('Cleanup done');
    process.exit(0);
}

runTests().catch(console.error);
