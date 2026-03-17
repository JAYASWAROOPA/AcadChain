const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';

async function main() {
    await mongoose.connect(MONGO_URI);

    const User = mongoose.model('User', new mongoose.Schema({
        name: String, email: String, role: String,
        university: String, department: String,
        academicYear: String, accountStatus: String
    }));

    const users = await User.find({}).select('-__v').lean();
    let out = '';

    const roles = ['admin', 'faculty', 'student', 'recruiter'];
    for (const role of roles) {
        const roleUsers = users.filter(u => u.role === role);
        out += `\n=== ${role.toUpperCase()} (${roleUsers.length}) ===\n`;
        roleUsers.forEach(u => {
            out += `  ID:         ${u._id}\n`;
            out += `  Name:       ${u.name}\n`;
            out += `  Email:      ${u.email}\n`;
            out += `  Status:     ${u.accountStatus || 'active'}\n`;
            if (u.university) out += `  University: ${u.university}\n`;
            if (u.department) out += `  Department: ${u.department}\n`;
            if (u.academicYear) out += `  Year:       ${u.academicYear}\n`;
            out += `  ---\n`;
        });
    }

    fs.writeFileSync(path.resolve(__dirname, 'users_output.txt'), out);
    console.log('Done. Output written to users_output.txt');
    await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
