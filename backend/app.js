const express = require('express');
const app = express();
const cloudinary = require('cloudinary');
const cors = require('cors')
const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const genre = require('./routes/genre');
const artist = require('./routes/artist');
const connectDatabase = require('./config/database');
const ErrorHandler = require('./utils/ErrorHandler');
const errorHandler = require('./middleware/errorHandler');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Recordia API is running',
        endpoints: '/api/v1',
    });
});

app.use(async (req, res, next) => {
    await connectDatabase();
    next();
});

app.get('/api/v1', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Recordia API and database are connected',
    });
});

app.use('/api/v1', products);
app.use('/api/v1', auth);
app.use('/api/v1', order);
app.use('/api/v1', genre);
app.use('/api/v1', artist);

app.use((req, res, next) => {
    next(new ErrorHandler(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

app.use(errorHandler);

module.exports = app