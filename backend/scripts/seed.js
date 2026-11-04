const dns = require('dns');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config({ path: path.resolve(__dirname, '../env.txt') });
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

const connectDatabase = require('../config/database');
const Artist = require('../models/artist');
const Genre = require('../models/genre');
const Product = require('../models/product');

const artists = [
    { name: 'The Paper Moons', bio: 'A fictional indie rock band for sample catalog data.' },
    { name: 'Neon Harbor', bio: 'A fictional alternative pop band for sample catalog data.' }
];

const genres = [
    { name: 'Indie Rock' },
    { name: 'Alternative' },
    { name: 'Pop' }
];

const products = [
    {
        album_title: 'Midnight Signals',
        artist: 'The Paper Moons',
        genre: 'Indie Rock',
        merch_type: 'Vinyl',
        price: 1299,
        description: 'Sample indie rock album for testing the Recordia catalog.',
        stocks: 12
    },
    {
        album_title: 'Paper Satellites',
        artist: 'The Paper Moons',
        genre: 'Alternative',
        merch_type: 'Vinyl',
        price: 1399,
        description: 'Sample alternative album for testing search and filters.',
        stocks: 8
    },
    {
        album_title: 'Afterglow Radio',
        artist: 'Neon Harbor',
        genre: 'Pop',
        merch_type: 'Vinyl',
        price: 1199,
        description: 'Sample pop album for testing the Recordia catalog.',
        stocks: 10
    },
    {
        album_title: 'The Paper Moons Tour Tee',
        artist: 'The Paper Moons',
        merch_type: 'T-Shirt',
        price: 799,
        description: 'Sample band T-shirt for testing merchandise filters.',
        stocks: 15
    },
    {
        album_title: 'Neon Harbor Art Poster',
        artist: 'Neon Harbor',
        merch_type: 'Poster',
        price: 499,
        description: 'Sample band poster for testing merchandise filters.',
        stocks: 20
    }
];

const ensureByName = (Model, record) => Model.findOneAndUpdate(
    { name: record.name },
    { $setOnInsert: record },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
);

const ensureProduct = (record, artist, genre) => {
    const product = {
        ...record,
        artist: artist._id
    };

    if (genre) {
        product.genre = genre._id;
    }

    return Product.findOneAndUpdate(
        {
            album_title: record.album_title,
            artist: artist._id,
            merch_type: record.merch_type
        },
        { $setOnInsert: product },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
};

const seed = async () => {
    await connectDatabase();

    const artistRecords = new Map();
    for (const artist of artists) {
        artistRecords.set(artist.name, await ensureByName(Artist, artist));
    }

    const genreRecords = new Map();
    for (const genre of genres) {
        genreRecords.set(genre.name, await ensureByName(Genre, genre));
    }

    for (const product of products) {
        const artist = artistRecords.get(product.artist);
        const genre = product.genre ? genreRecords.get(product.genre) : undefined;
        await ensureProduct(product, artist, genre);
    }

    console.log(
        `Seed complete: ${artists.length} artists, ${genres.length} genres, ` +
        `${products.length} products ensured. Existing records were left unchanged.`
    );
};

seed()
    .catch((error) => {
        console.error('Database seeding failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
