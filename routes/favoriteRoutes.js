const express = require('express');
const router = express.Router();

const {
    addFavorite,
    getFavorites,
    removeFavorite
} = require('../controller/favoriteController');

const authMiddleware = require('../middleware/authmiddleware');
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');

// NORMAL USER ACCESS
const userAccess = [
    authMiddleware,
    accountTypeMiddleware('user')
];

// ADD FAVORITE
router.post(
    '/addfavorite/:propertyId',
    ...userAccess,
    addFavorite
);

// GET MY FAVORITES
router.get(
    '/getmyfavorites',
    ...userAccess,
    getFavorites
);

// DELETE FAVORITE
router.delete(
    '/deletefavorite/:propertyId',
    ...userAccess,
    removeFavorite
);

module.exports = router;