const Product = require('../models/product');
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
    const filteredProductsCount = await Product.countDocuments(
        apiFeatures.getFilters()
    );

    apiFeatures.pagination();
    const products = await apiFeatures.query
        .populate('artist')
        .populate('genre');
    const totalPages = Math.ceil(
        filteredProductsCount / apiFeatures.resPerPage
    );

    res.status(200).json({
        success: true,
        products,
        productsCount,
        filteredProductsCount,
        resPerPage: apiFeatures.resPerPage,
        totalPages
    });
});

exports.updateProduct = catchAsync(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

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

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        productData,
        {
            new: true,
            runValidators: true
        }
    );

    if (hasImageSelection || imageSources.length > 0) {
        const retainedImages = productData.images || product.images;
        await deleteProductImages(
            product.images.filter((image) =>
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

    res.status(200).json({
        success: true,
        products
    });
});

exports.createProductReview = catchAsync(async (req, res) => {
    const { rating, comment, productId } = req.body;
    const numericRating = Number(rating);
    if (!productId || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: 'Product and rating from 1 to 5 are required' });
    }

    const eligibleOrder = await Order.exists({
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

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: numericRating,
        comment: filterBadWords(comment)
    };
    const existingReview = product.reviews.find(
        (existingReview) =>
            existingReview.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
        existingReview.comment = review.comment;
        existingReview.rating = review.rating;
        if (req.file) {
            existingReview.image = await uploadReviewImage(req.file);
        }
    } else {
        if (req.file) {
            review.image = await uploadReviewImage(req.file);
        }
        product.reviews.push(review);
    }

    product.numOfReviews = product.reviews.length;
    product.ratings = product.numOfReviews
        ? product.reviews.reduce((sum, item) => sum + item.rating, 0) / product.numOfReviews
        : 0;
    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true
    });
});

exports.getProductReviews = catchAsync(async (req, res) => {
    const product = await Product.findById(req.query.productId || req.query.id);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    });
});

exports.canReview = catchAsync(async (req, res) => {
    const productId = req.query.productId;
    const canReview = Boolean(await Order.exists({
        user: req.user._id,
        orderStatus: 'Completed',
        'orderItems.product': productId
    }));

    res.status(200).json({ success: true, canReview });
});

exports.deleteOwnReview = catchAsync(async (req, res) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = product.reviews.filter(
        (review) => review.user.toString() !== req.user._id.toString()
    );
    if (reviews.length === product.reviews.length) {
        return res.status(404).json({ success: false, message: 'Your review was not found' });
    }

    product.reviews = reviews;
    product.numOfReviews = reviews.length;
    product.ratings = reviews.length
        ? reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length
        : 0;
    await product.save({ validateBeforeSave: false });
    res.status(200).json({ success: true });
});

exports.deleteReview = catchAsync(async (req, res) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const reviews = product.reviews.filter(
        (review) => review._id.toString() !== req.query.id.toString()
    );
    const ratings = reviews.length
        ? reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length
        : 0;

    await Product.findByIdAndUpdate(
        req.query.productId,
        {
            reviews,
            ratings,
            numOfReviews: reviews.length
        },
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true
    });
});

exports.getAllReviews = catchAsync(async (req, res) => {
    const products = await Product.find(
        { 'reviews.0': { $exists: true } },
        { album_title: 1, reviews: 1 }
    ).populate('reviews.user', 'name email');

    const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const minRating = Number(req.query.minRating);
    const maxRating = Number(req.query.maxRating);
    const reviews = products.flatMap((product) => product.reviews.map((review) => ({
        _id: review._id,
        product: { _id: product._id, album_title: product.album_title },
        user: review.user,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        image: review.image
    }))).filter((review) => (
        (!search
            || String(review.comment || '').toLowerCase().includes(search)
            || String(review.product?.album_title || '').toLowerCase().includes(search)
            || String(review.name || '').toLowerCase().includes(search)
            || String(review.user?.email || '').toLowerCase().includes(search))
        && (!Number.isInteger(minRating) || review.rating >= minRating)
        && (!Number.isInteger(maxRating) || review.rating <= maxRating)
    ));

    res.status(200).json({ success: true, reviews });
});
