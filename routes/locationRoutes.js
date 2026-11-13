
const express = require('express');
const router = express.Router();

const {
    Getalllocations,
    Addlocation
} = require('../controller/locationcontroller');

const authMiddleware = require('../middleware/authMiddleware');

const adminOnly = (req, res, next) => {
    if (
        !req.user ||
        req.user.accountType !== 'admin' ||
        req.user.role !== 'admin'
    ) {
        return res.status(403).json({
            message: 'Administrator access required'
        });
    }
    next();
};

// PUBLIC
router.get('/getalllocations', Getalllocations);

// ADMIN ONLY
router.post('/addlocation', authMiddleware, adminOnly, Addlocation);

module.exports = router;
