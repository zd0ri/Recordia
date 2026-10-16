const Artist = require('../models/artist');
const Product = require('../models/product');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsync = require('../utils/catchAsync');
const {
    getImageSources,
    deleteProductImages,
    uploadArtistImages
} = require('../utils/productImages');

exports.getArtists = catchAsync(async (req, res) => {
    const artists = await Artist.find().sort({ name: 1 });

    res.status(200).json({
        success: true,
        artists
    });
});

exports.createArtist = catchAsync(async (req, res) => {
    const [image] = await uploadArtistImages(
        req.file ? [req.file] : getImageSources(req)
    );
    const artist = await Artist.create({
        name: req.body.name,
        bio: req.body.bio,
        image
    });

    res.status(201).json({
        success: true,
        artist
    });
});

exports.updateArtist = catchAsync(async (req, res) => {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
        return res.status(404).json({
            success: false,
            message: 'Artist not found'
        });
    }

    const previousImage = artist.image
        ? {
            public_id: artist.image.public_id,
            url: artist.image.url
        }
        : null;
    artist.name = req.body.name;
    artist.bio = req.body.bio;
    const imageSources = req.file ? [req.file] : getImageSources(req);

    if (imageSources.length > 0) {
        const [image] = await uploadArtistImages(imageSources);
        artist.image = image;
    } else if (req.body.removeImage === 'true' || req.body.removeImage === true) {
        artist.image = undefined;
    }

    await artist.save();

    if (imageSources.length > 0 || req.body.removeImage === 'true' || req.body.removeImage === true) {
        await deleteProductImages(previousImage ? [previousImage] : []);
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

    await deleteProductImages(artist.image ? [artist.image] : []);

    res.status(200).json({
        success: true,
        message: 'Artist deleted'
    });
});
