const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
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
});

reviewSchema.index(
    { order: 1, product: 1 },
    { unique: true, partialFilterExpression: { order: { $exists: true } } }
);

module.exports = mongoose.model('Review', reviewSchema);
