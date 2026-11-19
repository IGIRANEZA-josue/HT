
const express = require('express');
const router = express.Router();

const {
    createRentalRequest,
    getMyRentalRequests
} = require('../controller/rentalRequestController');

const authMiddleware = require('../middleware/authMiddleware');

const seekerOnly = (req, res, next) => {
    if (
        !req.user ||
        req.user.accountType !== 'user' ||
        req.user.role !== 'seeker'
    ) {
        return res.status(403).json({
            message: 'Seeker access required'
        });
    }

    next();
};

// SEEKER ONLY
router.post('/addrentalrequest', authMiddleware, seekerOnly, createRentalRequest);

router.get('/getmyrentalrequests', authMiddleware, seekerOnly, getMyRentalRequests);

module.exports = router;
