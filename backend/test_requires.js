console.log('Testing requires...');
try {
    require('./models/User');
    console.log('User model OK');
    require('./models/AcademicRecord');
    console.log('AcademicRecord model OK');
    require('./models/Reputation');
    console.log('Reputation model OK');
    require('./middleware/authMiddleware');
    console.log('Auth middleware OK');
    require('./routes/auth');
    console.log('Auth route OK');
    require('./routes/records');
    console.log('Records route OK');
    require('./routes/reputation');
    console.log('Reputation route OK');
} catch (err) {
    console.error('Error during require:', err);
    process.exit(1);
}
