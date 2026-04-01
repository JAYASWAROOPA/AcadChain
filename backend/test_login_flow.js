const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';

// Test email - use a real email you want to test
const testEmail = 'test@example.com';
const testPassword = 'TestPassword123';

async function runTests() {
    console.log('🧪 Starting Login Flow Tests...\n');

    // Test 1: Check if server is running
    console.log('1️⃣  Testing if server is running...');
    try {
        const response = await axios.get('http://localhost:5000');
        console.log('✅ Server is running:', response.data);
    } catch (err) {
        console.error('❌ Server is NOT running. Start the server first!');
        console.error('Error:', err.message);
        process.exit(1);
    }

    // Test 2: Check if MongoDB is connected
    console.log('\n2️⃣  Testing MongoDB Connection...');
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Failed:', err.message);
        process.exit(1);
    }

    // Test 3: Check database entries
    console.log(`\n3️⃣  Checking database for email: ${testEmail}`);
    try {
        const User = require('./models/User');
        const AllowedUser = require('./models/AllowedUser');

        const user = await User.findOne({ email: testEmail });
        const allowed = await AllowedUser.findOne({ email: testEmail });

        console.log('User exists:', !!user);
        console.log('Email whitelisted:', !!allowed);

        if (!user && !allowed) {
            console.log('⚠️  Neither user nor whitelisted entry exists!');
            console.log('You need to whitelist this email first.');
        }
    } catch (err) {
        console.error('❌ Database Query Error:', err.message);
    }

    // Test 4: Test Check Email Endpoint
    console.log(`\n4️⃣  Testing /auth/check-email endpoint...`);
    try {
        const response = await axios.post(`${API_URL}/auth/check-email`, {
            email: testEmail
        });
        console.log('✅ Endpoint Response:', response.data);
    } catch (err) {
        console.error('❌ Endpoint Error:', err.response?.data || err.message);
    }

    await mongoose.disconnect();
    console.log('\n✨ Tests completed!');
}

runTests();
