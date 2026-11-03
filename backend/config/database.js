const mongoose = require('mongoose');

let connectionPromise;

const connectDatabase = () => {
    if (mongoose.connection.readyState === 1) {
        return Promise.resolve(mongoose.connection);
    }

    const dbUri = process.env.DB_URI || (
        process.env.VERCEL ? undefined : 'mongodb://127.0.0.1:27017/ecommerce'
    );

    if (!dbUri) {
        return Promise.reject(new Error('DB_URI environment variable is required.'));
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(dbUri, {
            serverSelectionTimeoutMS: 5000,
        })
            .then((con) => {
                console.log(`MongoDB database connected with host: ${con.connection.host}`);
                return con.connection;
            })
            .catch((error) => {
                console.error('MongoDB connection failed:', error.message);
                throw error;
            })
            .finally(() => {
                connectionPromise = undefined;
            });
    }

    return connectionPromise;
};

module.exports = connectDatabase;