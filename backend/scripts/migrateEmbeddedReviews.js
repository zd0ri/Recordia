const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: path.resolve(__dirname, '../env.txt') });
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

const Product = require('../models/product');
const Review = require('../models/review');
const Order = require('../models/order');

const migrateEmbeddedReviews = async () => {
    const dbUri = process.env.DB_URI || 'mongodb://127.0.0.1:27017/ecommerce';
    await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
    await Review.init();
    const products = await Product.collection.find({
        'reviews.0': { $exists: true }
    }).toArray();
    let migratedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
        const operations = [];
        for (const review of product.reviews || []) {
            const order = await Order.findOne({
                user: review.user,
                orderStatus: 'Completed',
                'orderItems.product': product._id
            }).sort({ createdAt: -1 }).select('_id').lean();
            if (!order) {
                skippedCount += 1;
                continue;
            }

            operations.push({
                updateOne: {
                    filter: { order: order._id, product: product._id },
                    update: {
                        $setOnInsert: {
                            ...(review._id ? { _id: review._id } : {}),
                            order: order._id,
                            product: product._id,
                            user: review.user,
                            name: review.name,
                            rating: review.rating,
                            comment: review.comment,
                            ...(review.image ? { image: review.image } : {}),
                            createdAt: review.createdAt || new Date()
                        }
                    },
                    upsert: true
                }
            });
        }

        if (operations.length) {
            const result = await Review.collection.bulkWrite(operations, { ordered: true });
            migratedCount += result.upsertedCount;
        }

        if (operations.length !== (product.reviews || []).length) continue;
        const stats = await Review.aggregate([
            { $match: { product: product._id } },
            {
                $group: {
                    _id: '$product',
                    count: { $sum: 1 },
                    rating: { $avg: '$rating' }
                }
            }
        ]);
        await Product.collection.updateOne(
            { _id: product._id },
            {
                $unset: { reviews: '' },
                $set: {
                    ratings: stats[0]?.rating || 0,
                    numOfReviews: stats[0]?.count || 0
                }
            }
        );
    }

    console.log(`Migrated ${migratedCount} embedded reviews from ${products.length} products.`);
    if (skippedCount) {
        console.warn(`${skippedCount} legacy reviews were retained in their product documents because no completed checkout matched.`);
    }
};

migrateEmbeddedReviews()
    .catch((error) => {
        console.error('Review migration failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
