const mongoose = require('mongoose');

const connectDatabase = () => {
    const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

    console.log(`Connecting to MongoDB: ${dbUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);

    mongoose.connect(dbUri, {
        serverSelectionTimeoutMS: 5000,
    })
        .then((con) => {
            console.log(`MongoDB Database connected with HOST: ${con.connection.host}`);
        })
        .catch((err) => {
            console.error('MongoDB connection failed:');
            console.error(err.message);
            console.error('Set a valid DB_URI in backend/env.txt or start MongoDB locally on localhost:27017.');
            process.exit(1);
        });
};

module.exports = connectDatabase