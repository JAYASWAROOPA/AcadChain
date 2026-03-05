const express = require('express');
const app = express();

try {
    const drivesRouter = require('./routes/drives');
    app.use('/api/drives', drivesRouter);
    console.log('Routes in /api/drives:');
    drivesRouter.stack.forEach(r => {
        if (r.route) {
            console.log(`${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
        }
    });
    process.exit(0);
} catch (err) {
    console.error('Error loading drives router:', err);
    process.exit(1);
}
