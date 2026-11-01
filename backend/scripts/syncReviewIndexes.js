const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: path.resolve(__dirname, '../env.txt') });
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

const Review = require('../models/review');
const Order = require('../models/order');

const syncReviewIndexes = async () => {
    const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
    const legacyReviews = await Review.find({ order: { $exists: false } }).lean();
    let associatedReviews = 0;
    for (const review of legacyReviews) {
        const order = await Order.findOne({
            user: review.user,
            orderStatus: 'Completed',
            'orderItems.product': review.product
        }).sort({ createdAt: -1 }).select('_id').lean();
        if (order) {
            await Review.updateOne({ _id: review._id }, { $set: { order: order._id } });
            associatedReviews += 1;
        }
    }

    const droppedIndexes = await Review.syncIndexes();
    console.log(`Associated ${associatedReviews} legacy reviews with their latest completed checkout.`);
    console.log(`Review indexes synchronized. Removed indexes: ${droppedIndexes.join(', ') || 'none'}`);
};

syncReviewIndexes()
    .catch((error) => {
        console.error('Review index synchronization failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
