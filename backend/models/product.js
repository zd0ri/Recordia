const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    album_title: {
        type: String,
        required: [true, 'Please enter album title'],
        trim: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
        required: [true, 'Please select an artist']
    },
    genre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
        required: [true, 'Please select a genre']
    },
    merch_type: {
        type: String,
        enum: [
            'Vinyl',
            'T-Shirt',
            'Poster',
            'Tote Bag',
            'Accessory',
            'Other'
        ],
        required: [true, 'Please select merchandise type']
    },
    price: {
        type: Number,
        required: [true, 'Please enter product price'],
        min: [0, 'Price cannot be negative'],
        default: 0
    },
    description: {
        type: String,
        required: [true, 'Please enter product description']
    },
    stocks: {
        type: Number,
        min: [0, 'Stocks cannot be negative'],
        default: 0
    },
    images: [
        {
            public_id: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                required: true
            },
            image: {
                public_id: String,
                url: String
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    ratings: {
        type: Number,
        default: 0
    },
    numOfReviews: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);
