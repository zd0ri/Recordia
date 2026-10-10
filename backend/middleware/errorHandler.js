const ErrorHandler = require('../utils/ErrorHandler');

module.exports = (err, req, res, next) => {
    let error = err;

    if (err.name === 'ValidationError') {
        error = new ErrorHandler(
            Object.values(err.errors).map((validationError) => validationError.message).join(', '),
            400
        );
    } else if (err.name === 'CastError') {
        error = new ErrorHandler(`Invalid ${err.path}: ${err.value}`, 400);
    } else if (err.code === 11000) {
        const duplicateFields = Object.keys(err.keyValue || {}).join(', ');
        error = new ErrorHandler(
            `Duplicate value for ${duplicateFields || 'a unique field'}`,
            400
        );
    } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        error = new ErrorHandler('Invalid or expired token', 401);
    } else if (err.name === 'MulterError') {
        error = new ErrorHandler(err.message, 400);
    } else if (!(err instanceof ErrorHandler)) {
        error = new ErrorHandler(err.message || 'Internal Server Error', err.statusCode || 500);
    }

    const response = {
        success: false,
        message: error.message || 'Internal Server Error'
    };

    if (process.env.NODE_ENV === 'DEVELOPMENT') {
        response.stack = error.stack;
    }

    res.status(error.statusCode || 500).json(response);
};
