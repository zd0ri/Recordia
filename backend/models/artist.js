const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter artist name'],
        unique: true,
        trim: true
    },
    bio: {
        type: String
    },
    image: {
        public_id: String,
        url: String
    }
});

module.exports = mongoose.model('Artist', artistSchema);
