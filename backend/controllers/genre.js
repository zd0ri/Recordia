const Genre = require('../models/genre');
const Product = require('../models/product');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsync = require('../utils/catchAsync');

exports.getGenres = catchAsync(async (req, res) => {
    const genres = await Genre.find().sort({ name: 1 });

    res.status(200).json({
        success: true,
        genres
    });
});

exports.createGenre = catchAsync(async (req, res) => {
    const genre = await Genre.create({
        name: req.body.name
    });

    res.status(201).json({
        success: true,
        genre
    });
});

exports.updateGenre = catchAsync(async (req, res) => {
    const genre = await Genre.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name },
        {
            new: true,
            runValidators: true
        }
    );

    if (!genre) {
        return res.status(404).json({
            success: false,
            message: 'Genre not found'
        });
    }

    res.status(200).json({
        success: true,
        genre
    });
});

exports.deleteGenre = catchAsync(async (req, res, next) => {
    const productUsesGenre = await Product.exists({
        genre: req.params.id
    });

    if (productUsesGenre) {
        return next(new ErrorHandler(
            'Cannot delete genre because it is still used by a product',
            400
        ));
    }

    const genre = await Genre.findByIdAndDelete(req.params.id);

    if (!genre) {
        return res.status(404).json({
            success: false,
            message: 'Genre not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Genre deleted'
    });
});
