const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter genre name'],
        unique: true,
        trim: true
    }
});

module.exports = mongoose.model('Genre', genreSchema);
