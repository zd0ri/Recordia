const express = require('express');
const app = express();
const cors = require('cors')
const products = require('./routes/product');
const auth = require('./routes/auth');
const order = require('./routes/order');
const genre = require('./routes/genre');
const artist = require('./routes/artist');
const ErrorHandler = require('./utils/ErrorHandler');
const errorHandler = require('./middleware/errorHandler');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
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