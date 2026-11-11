const router = require('express').Router();
const favorite = require('../controller/favoriteController');
const auth = require('../middleware/authMiddleware');
const protect = auth.authMiddleware || auth;

router.get('/favorites', protect, favorite.getFavorites);
router.post('/favorites/:propertyId', protect, favorite.addFavorite);
router.delete('/favorites/:propertyId', protect, favorite.removeFavorite);

module.exports = router;
