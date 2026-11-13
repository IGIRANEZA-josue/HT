
const express = require('express');
const router = express.Router();

const {
    Addfavorite,
    Getmyfavorites,
    Deletefavorite
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

router.post('/addfavorite', authMiddleware, userOnly, Addfavorite);
router.get('/getmyfavorites', authMiddleware, userOnly, Getmyfavorites);
router.delete('/deletefavorite/:id', authMiddleware, userOnly, Deletefavorite);

module.exports = router;
