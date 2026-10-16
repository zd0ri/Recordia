const fs = require('fs/promises');
const cloudinary = require('cloudinary');

const uploadImage = (source, folder) => {
    const uploadSource = typeof source === 'string' ? source : source.path;

    return cloudinary.v2.uploader.upload(uploadSource, {
        folder,
        quality: 'auto',
        fetch_format: 'auto'
    });
};

const uploadReviewImage = async (source) => {
    const result = await cloudinary.v2.uploader.upload(source.path, {
        folder: 'reviews',
        width: 1200,
        crop: 'limit'
    });
    await fs.unlink(source.path);
    return {
        public_id: result.public_id,
        url: result.secure_url
    };
};

const getImageSources = (req) => {
    const sources = [];

    if (Array.isArray(req.files)) {
        sources.push(...req.files);
    }

    if (req.body.images) {
        if (Array.isArray(req.body.images)) {
            sources.push(...req.body.images);
        } else if (typeof req.body.images === 'string') {
            try {
                const parsedImages = JSON.parse(req.body.images);
                sources.push(...(Array.isArray(parsedImages) ? parsedImages : [req.body.images]));
            } catch (error) {
                sources.push(req.body.images);
            }
        }
    }

    return sources;
};

const uploadImages = async (sources, folder) => {
    const uploadedImages = [];

    try {
        for (const source of sources) {
            const result = await uploadImage(source, folder);
            uploadedImages.push({
                public_id: result.public_id,
                url: result.secure_url
            });

            if (typeof source !== 'string' && source.path) {
                await fs.unlink(source.path);
            }
        }

        return uploadedImages;
    } catch (error) {
        await deleteProductImages(uploadedImages);
        throw error;
    }
};

const uploadProductImages = (sources) => uploadImages(sources, 'products');
const uploadArtistImages = (sources) => uploadImages(sources, 'artists');

const deleteProductImages = async (images = []) => {
    await Promise.all(
        images
            .filter((image) => image && image.public_id)
            .map((image) => cloudinary.v2.uploader.destroy(image.public_id))
    );
};

module.exports = {
    getImageSources,
    uploadProductImages,
    uploadArtistImages,
    deleteProductImages,
    uploadReviewImage
};
