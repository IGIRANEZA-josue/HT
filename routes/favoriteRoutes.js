
const express = require('express');
const router = express.Router();

const {
    addFavorite,
    getFavorites,
    removeFavorite
} = require('../controller/favoriteController');

const authMiddleware = require('../middleware/authMiddleware');

const userOnly = (req, res, next) => {
    if (!req.user || req.user.accountType !== 'user') {
        return res.status(403).json({
            message: 'User account access required'
        });
    }

    next();
};

// ADD FAVORITE
router.post('/addfavorite/:propertyId', authMiddleware, userOnly, addFavorite);

// GET MY FAVORITES
router.get('/getmyfavorites', authMiddleware, userOnly, getFavorites);

// DELETE FAVORITE
router.delete('/deletefavorite/:propertyId', authMiddleware, userOnly, removeFavorite);

module.exports = router;
