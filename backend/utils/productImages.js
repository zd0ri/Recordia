const fs = require('fs/promises');
const cloudinary = require('cloudinary');

const uploadImage = (source) => {
    const uploadSource = typeof source === 'string' ? source : source.path;

    return cloudinary.v2.uploader.upload(uploadSource, {
        folder: 'products',
        width: 150,
        crop: 'scale'
    });
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

const uploadProductImages = async (sources) => {
    const uploadedImages = [];

    try {
        for (const source of sources) {
            const result = await uploadImage(source);
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
    deleteProductImages
};
