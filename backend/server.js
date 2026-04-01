const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Fallback configuration if .env fails to load
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not found in environment. Using fallback secret.');
    process.env.JWT_SECRET = 'acadchain_fallback_secret_key_999';
}
if (!process.env.MONGO_URI) {
    console.warn('WARNING: MONGO_URI not found in environment. Using fallback URI.');
    process.env.MONGO_URI = 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';
}

const app = express();
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    fs.appendFileSync(path.join(__dirname, 'server.log'), log);
    console.log(log);
    next();
});

console.log('Environment Configuration:');
console.log('JWT_SECRET Status:', process.env.JWT_SECRET ? 'Active' : 'Missing');
console.log('Starting server...');

// Database connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/records', require('./routes/records'));
app.use('/api/reputation', require('./routes/reputation'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/recruitment', require('./routes/recruitment'));

// Debug: Print all registered routes
/*
let routeInfo = '\n--- Registered Routes ---\n';
app._router.stack.forEach(middleware => {
    if (middleware.route) {
        routeInfo += `${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}\n`;
    } else if (middleware.name === 'router') {
        const path = middleware.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^', '').replace('\\/', '/');
        middleware.handle.stack.forEach(handler => {
            if (handler.route) {
                routeInfo += `${Object.keys(handler.route.methods).join(',').toUpperCase()} ${path}${handler.route.path}\n`;
            }
        });
    }
});
routeInfo += '------------------------\n';
console.log(routeInfo);
fs.appendFileSync(path.join(__dirname, 'server.log'), routeInfo);
*/
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('AcadChain API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const errorLog = `${new Date().toISOString()} - ERROR: ${err.message}\n${err.stack}\n`;
    fs.appendFileSync(path.join(__dirname, 'server.log'), errorLog);
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
