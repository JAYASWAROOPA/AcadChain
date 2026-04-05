const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('../db');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Ensure environment variables are set
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET not found in environment. Using fallback secret.');
    process.env.JWT_SECRET = 'acadchain_fallback_secret_key_999';
}
if (!process.env.MONGO_URI) {
    console.warn('WARNING: MONGO_URI not found in environment. Using fallback URI.');
    process.env.MONGO_URI = 'mongodb+srv://Jayaswaroopaec23_db_user:Jayamom22@cluster0.xnd1gcv.mongodb.net/?appName=Cluster0';
}

const app = express();

// Initialize database connection for serverless
let dbConnected = false;
const initDB = async () => {
    if (!dbConnected) {
        try {
            await connectDB();
            dbConnected = true;
        } catch (error) {
            console.error('Failed to connect to database:', error);
        }
    }
};
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://acad-chain-xsmn.vercel.app',
      'https://acad-chain.vercel.app',
      'https://acad-chain-b3dc.vercel.app'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    try {
        fs.appendFileSync(path.join(__dirname, '../server.log'), log);
    } catch(err) {
        // Ignore file system errors in serverless environments
    }
    console.log(log);
    next();
});

// Initialize database on every request (for serverless compatibility)
app.use(async (req, res, next) => {
    try {
        await initDB();
        next();
    } catch (error) {
        console.error('Database initialization error:', error);
        next();
    }
});

console.log('Environment Configuration:');
console.log('JWT_SECRET Status:', process.env.JWT_SECRET ? 'Active' : 'Missing');
console.log('MONGO_URI Status:', process.env.MONGO_URI ? 'Configured' : 'Missing');
console.log('Starting server...');

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/records', require('../routes/records'));
app.use('/api/reputation', require('../routes/reputation'));
app.use('/api/users', require('../routes/users'));
app.use('/api/admin', require('../routes/admin'));
app.use('/api/recruitment', require('../routes/recruitment'));
app.use('/api/reports', require('../routes/reports'));

app.get('/', (req, res) => {
    res.send('AcadChain API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
    const errorLog = `${new Date().toISOString()} - ERROR: ${err.message}\n${err.stack}\n`;
    try {
        fs.appendFileSync(path.join(__dirname, '../server.log'), errorLog);
    } catch(e) {
        // Ignore file system errors in serverless environments
    }
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export for Vercel serverless functions
module.exports = app;
