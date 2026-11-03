const Product = require('../models/product');
const Review = require('../models/review');
const Artist = require('../models/artist');
const Genre = require('../models/genre');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const {
    getImageSources,
    uploadProductImages,
    deleteProductImages,
    uploadReviewImage
} = require('../utils/productImages');
const Order = require('../models/order');
const filterBadWords = require('../utils/filterBadWords');
const ErrorHandler = require('../utils/ErrorHandler');

const getReviewStats = async (productIds) => {
    const stats = await Review.aggregate([
        { $match: { product: { $in: productIds } } },
        {
            $group: {
                _id: '$product',
                count: { $sum: 1 },
                rating: { $avg: '$rating' }
            }
        }
    ]);

    return new Map(stats.map((item) => [item._id.toString(), item]));
};

const syncProductReviewStats = async (productId) => {
    const [stats] = await Review.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: '$product',
                count: { $sum: 1 },
                rating: { $avg: '$rating' }
            }
        }
    ]);
    await Product.updateOne(
        { _id: productId },
        {
            ratings: stats?.rating || 0,
            numOfReviews: stats?.count || 0
        }
    );
};

const parseArrayField = (value) => {
    let parsedValue = value;

    if (typeof value === 'string') {
        try {
            parsedValue = JSON.parse(value);
        } catch (error) {
            throw new ErrorHandler('existingImageIds must be a valid array', 400);
        }
    }

    if (!Array.isArray(parsedValue) || parsedValue.some((id) => typeof id !== 'string')) {
        throw new ErrorHandler('existingImageIds must be an array of image IDs', 400);
    }

    return parsedValue;
};

exports.newProduct = catchAsync(async (req, res) => {
    const images = await uploadProductImages(getImageSources(req));
    const productData = {
        ...req.body,
        images
    };

    const product = await Product.create(productData);

    res.status(201).json({
        success: true,
        product
    });
});

exports.getSingleProduct = catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('artist')
        .populate('genre');

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    const stats = (await getReviewStats([product._id])).get(product._id.toString());
    product.ratings = stats?.rating || 0;
    product.numOfReviews = stats?.count || 0;

    res.status(200).json({
        success: true,
        product
    });
});

exports.getProducts = catchAsync(async (req, res) => {
    const productsCount = await Product.countDocuments();
    const apiFeatures = new APIFeatures(Product.find(), req.query)
        .search()
        .filter();
    const filters = apiFeatures.getFilters();
    const reviewCriteria = {};
    if (req.query['ratings[eq]'] !== undefined) {
        reviewCriteria.rating = { $eq: Number(req.query['ratings[eq]']) };
    }
    if (req.query['reviews[gte]'] !== undefined) {
        reviewCriteria.count = { $gte: Number(req.query['reviews[gte]']) };
    }
    const reviewPipeline = [];
    if (req.query.review) {
        reviewPipeline.push({
            $match: {
                comment: {
                    $regex: req.query.review.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                    $options: 'i'
                }
            }
        });
    }
    if (Object.keys(reviewCriteria).length || req.query.review) {
        reviewPipeline.push({
            $group: {
                _id: '$product',
                count: { $sum: 1 },
                rating: { $avg: '$rating' }
            }
        });
        if (Object.keys(reviewCriteria).length) reviewPipeline.push({ $match: reviewCriteria });
        const matchingReviews = await Review.aggregate(reviewPipeline);
        filters._id = { $in: matchingReviews.map((review) => review._id) };
    }
    const filteredProductsCount = await Product.countDocuments(filters);

    const requestedPage = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const requestedLimit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const products = await Product.find(filters)
        .limit(requestedLimit)
        .skip(requestedLimit * (requestedPage - 1))
        .populate('artist')
        .populate('genre');
    const reviewStats = await getReviewStats(products.map((product) => product._id));
    products.forEach((product) => {
        const stats = reviewStats.get(product._id.toString());
        product.ratings = stats?.rating || 0;
        product.numOfReviews = stats?.count || 0;
    });
    const totalPages = Math.ceil(filteredProductsCount / requestedLimit);

    res.status(200).json({
        success: true,
        products,
        productsCount,
        filteredProductsCount,
        resPerPage: requestedLimit,
        totalPages
    });

});

exports.getProductFilterOptions = catchAsync(async (req, res) => {
    const [artistIds, genreIds, albums, merchTypes, priceRange] = await Promise.all([
        Product.distinct('artist'),
        Product.distinct('genre'),
        Product.distinct('album_title'),
        Product.distinct('merch_type'),
        Product.aggregate([
            {
                $group: {
                    _id: null,
                    min: { $min: '$price' },
                    max: { $max: '$price' }
                }
            }
        ])
    ]);
    const [artists, genres] = await Promise.all([
        Artist.find({ _id: { $in: artistIds } }).select('name').sort({ name: 1 }),
        Genre.find({ _id: { $in: genreIds } }).select('name').sort({ name: 1 })
    ]);

    res.status(200).json({
        success: true,
        artists,
        genres,
        albums: albums.filter(Boolean).sort((a, b) => a.localeCompare(b)),
        merchTypes: merchTypes.filter(Boolean).sort(),
        priceRange: priceRange[0]
            ? [priceRange[0].min, priceRange[0].max]
            : [0, 0]
    });
});

exports.getFeaturedReviews = catchAsync(async (req, res) => {
    const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('product', 'album_title')
        .populate('user', 'name');

    res.status(200).json({ success: true, reviews });
});

exports.getProductSuggestions = catchAsync(async (req, res) => {
    const keyword = typeof req.query.keyword === 'string'
        ? req.query.keyword.trim()
        : '';
    if (!keyword) {
        return res.status(200).json({ success: true, products: [] });
    }

    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const products = await Product.find({
        $or: [
            { album_title: { $regex: escapedKeyword, $options: 'i' } },
            { description: { $regex: escapedKeyword, $options: 'i' } }
        ]
    })
        .sort({ album_title: 1 })
        .limit(8)
        .populate('artist')
        .populate('genre');

    res.status(200).json({ success: true, products });
});

exports.updateProduct = catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    const previousImages = product.images;
    const imageSources = getImageSources(req);
    let productData = { ...req.body };
    const hasImageSelection = req.body.existingImageIds !== undefined;
    const existingImageIds = hasImageSelection
        ? parseArrayField(req.body.existingImageIds)
        : null;
    const existingImages = product.images.filter((image) =>
        existingImageIds?.includes(image.public_id)
    );

    delete productData.existingImageIds;

    if (hasImageSelection || imageSources.length > 0) {
        const newImages = await uploadProductImages(imageSources);
        productData.images = hasImageSelection
            ? [...existingImages, ...newImages]
            : newImages;
    } else {
        delete productData.images;
    }

    product.set(productData);
    const updatedProduct = await product.save();

    if (hasImageSelection || imageSources.length > 0) {
        const retainedImages = productData.images || product.images;
        await deleteProductImages(
            previousImages.filter((image) =>
                !retainedImages.some((retainedImage) =>
                    retainedImage.public_id === image.public_id
                )
            )
        );
    }

    res.status(200).json({
        success: true,
        product: updatedProduct
    });
});

exports.deleteProduct = catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    await deleteProductImages(product.images);
    await Review.deleteMany({ product: product._id });
    await product.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Product deleted'
    });
});

exports.bulkDeleteProducts = catchAsync(async (req, res) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'ids must be a non-empty array'
        });
    }

    const products = await Product.find({
        _id: { $in: ids }
    });

    if (products.length !== ids.length) {
        return res.status(404).json({
            success: false,
            message: 'One or more products were not found'
        });
    }

    await deleteProductImages(
        products.flatMap((product) => product.images)
    );
    await Review.deleteMany({ product: { $in: ids } });
    await Product.deleteMany({
        _id: { $in: ids }
    });

    res.status(200).json({
        success: true,
        deletedCount: products.length
    });
});

exports.updateProductStock = catchAsync(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        { stocks: req.body.stocks },
        {
            new: true,
            runValidators: true
        }
    );

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    res.status(200).json({
        success: true,
        product
    });
});

exports.getAdminProducts = catchAsync(async (req, res) => {
    const products = await Product.find()
        .populate('artist')
        .populate('genre');
    const reviewStats = await getReviewStats(products.map((product) => product._id));
    products.forEach((product) => {
        const stats = reviewStats.get(product._id.toString());
        product.ratings = stats?.rating || 0;
        product.numOfReviews = stats?.count || 0;
    });

    res.status(200).json({
        success: true,
        products
    });
});

exports.createProductReview = catchAsync(async (req, res) => {
    const { rating, comment, productId, orderId } = req.body;
    const numericRating = Number(rating);
    if (!productId || !orderId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: 'Product, order, and rating from 1 to 5 are required' });
    }

    const eligibleOrder = await Order.exists({
        _id: orderId,
        user: req.user._id,
        orderStatus: 'Completed',
        'orderItems.product': productId
    });
    if (!eligibleOrder) {
        return res.status(403).json({
            success: false,
            message: 'You can review this product only after completing an order for it'
        });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (typeof comment !== 'string' || !comment.trim()) {
        return res.status(400).json({ success: false, message: 'Review comment is required' });
    }

    const update = {
        name: req.user.name,
        rating: numericRating,
        comment: filterBadWords(comment)
    };
    if (req.file) update.image = await uploadReviewImage(req.file);

    await Review.findOneAndUpdate(
        { order: orderId, product: product._id },
        {
            $set: { ...update, user: req.user._id },
            $setOnInsert: { order: orderId, product: product._id }
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await syncProductReviewStats(product._id);

    res.status(200).json({
        success: true
    });
});

exports.getProductReviews = catchAsync(async (req, res) => {
    const productId = req.query.productId || req.query.id;
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const reviews = await Review.find({ product: product._id })
        .sort({ createdAt: -1 })
        .populate('user', 'name');

    res.status(200).json({
        success: true,
        reviews
    });
});

exports.canReview = catchAsync(async (req, res) => {
    const productId = req.query.productId;
    const orderId = req.query.orderId;
    const eligibleOrder = orderId ? await Order.exists({
        _id: orderId,
        user: req.user._id,
        orderStatus: 'Completed',
        'orderItems.product': productId
    }) : null;
    const existingReview = eligibleOrder
        ? await Review.exists({ order: orderId, product: productId })
        : null;

    res.status(200).json({
        success: true,
        canReview: Boolean(eligibleOrder),
        hasReview: Boolean(existingReview)
    });
});

exports.deleteOwnReview = catchAsync(async (req, res) => {
    const { productId, orderId } = req.query;
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = await Review.findOneAndDelete({
        product: product._id,
        order: orderId,
        user: req.user._id
    });
    if (!review) {
        return res.status(404).json({ success: false, message: 'Your review was not found' });
    }

    await syncProductReviewStats(product._id);
    res.status(200).json({ success: true });
});

exports.deleteReview = catchAsync(async (req, res) => {
    const review = await Review.findOneAndDelete({
        _id: req.query.id,
        product: req.query.productId
    });
    if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await syncProductReviewStats(review.product);
    res.status(200).json({ success: true });
});

exports.getAllReviews = catchAsync(async (req, res) => {
    const reviews = await Review.find()
        .sort({ createdAt: -1 })
        .populate('product', 'album_title')
        .populate('user', 'name email');

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const minRating = req.query.minRating === undefined || req.query.minRating === ''
        ? null
        : Number(req.query.minRating);
    const maxRating = req.query.maxRating === undefined || req.query.maxRating === ''
        ? null
        : Number(req.query.maxRating);
    const filteredReviews = reviews.filter((review) => (
        (!search
            || String(review.comment || '').toLowerCase().includes(search)
            || String(review.product?.album_title || '').toLowerCase().includes(search)
            || String(review.name || '').toLowerCase().includes(search)
            || String(review.user?.email || '').toLowerCase().includes(search))
        && (!Number.isInteger(minRating) || review.rating >= minRating)
        && (!Number.isInteger(maxRating) || review.rating <= maxRating)
    ));

    res.status(200).json({ success: true, reviews: filteredReviews });
});
