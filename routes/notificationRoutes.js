
const express = require('express');
const router = express.Router();

const {
    getNotifications,
    markNotificationRead
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

// GET MY NOTIFICATIONS
router.get('/getmynotifications', authMiddleware, userOnly, getNotifications);

// MARK NOTIFICATION AS READ
router.put('/marknotificationread/:id', authMiddleware, userOnly, markNotificationRead);

module.exports = router;
