const Artist = require('../models/artist');
const Product = require('../models/product');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsync = require('../utils/catchAsync');

exports.getArtists = catchAsync(async (req, res) => {
    const artists = await Artist.find().sort({ name: 1 });

    res.status(200).json({
        success: true,
        artists
    });
});

exports.createArtist = catchAsync(async (req, res) => {
    const artist = await Artist.create({
        name: req.body.name,
        bio: req.body.bio
    });

    res.status(201).json({
        success: true,
        artist
    });
});

exports.updateArtist = catchAsync(async (req, res) => {
    const artist = await Artist.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            bio: req.body.bio
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!artist) {
        return res.status(404).json({
            success: false,
            message: 'Artist not found'
        });
    }

    res.status(200).json({
        success: true,
        artist
    });
});

exports.deleteArtist = catchAsync(async (req, res, next) => {
    const productUsesArtist = await Product.exists({
        artist: req.params.id
    });

    if (productUsesArtist) {
        return next(new ErrorHandler(
            'Cannot delete artist because it is still used by a product',
            400
        ));
    }

    const artist = await Artist.findByIdAndDelete(req.params.id);

    if (!artist) {
        return res.status(404).json({
            success: false,
            message: 'Artist not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Artist deleted'
    });
});
