
const express = require('express');
const router = express.Router();

const {
    Getmynotifications,
    Marknotificationread
} = require('../controller/notificationController');

const authMiddleware = require('../middleware/authMiddleware');

const userOnly = (req, res, next) => {
    if (!req.user || req.user.accountType !== 'user') {
        return res.status(403).json({
            message: 'User account access required'
        });
    }
    next();
};

router.get('/getmynotifications', authMiddleware, userOnly, Getmynotifications);
router.put('/marknotificationread/:id', authMiddleware, userOnly, Marknotificationread);

module.exports = router;
