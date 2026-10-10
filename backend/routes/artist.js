const express = require('express');
const router = express.Router();

const {
    getArtists,
    createArtist,
    updateArtist,
    deleteArtist
} = require('../controllers/artist');

const {
    isAuthenticatedUser,
    authorizeRoles
} = require('../middleware/auth');

router.get('/artists', getArtists);
router.post(
    '/admin/artist',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createArtist
);
router.put(
    '/admin/artist/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateArtist
);
router.delete(
    '/admin/artist/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteArtist
);

module.exports = router;
