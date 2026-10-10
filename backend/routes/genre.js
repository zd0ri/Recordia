const express = require('express');
const router = express.Router();

const {
    getGenres,
    createGenre,
    updateGenre,
    deleteGenre
} = require('../controllers/genre');

const {
    isAuthenticatedUser,
    authorizeRoles
} = require('../middleware/auth');

router.get('/genres', getGenres);
router.post(
    '/admin/genre',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    createGenre
);
router.put(
    '/admin/genre/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    updateGenre
);
router.delete(
    '/admin/genre/:id',
    isAuthenticatedUser,
    authorizeRoles('admin'),
    deleteGenre
);

module.exports = router;
