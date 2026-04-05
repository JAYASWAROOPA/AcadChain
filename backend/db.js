const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        console.log('Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined');
        }

        console.log('Creating new MongoDB connection...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
            minPoolSize: 2,
        });

        cachedConnection = conn;
        console.log('MongoDB Connected');
        return conn;
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        throw error;
    }
};

module.exports = connectDB;
