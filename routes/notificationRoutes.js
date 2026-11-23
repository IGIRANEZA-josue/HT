const express = require('express');
const router = express.Router();

const {
    getNotifications,
    markNotificationRead
} = require('../controller/notificationController');

const authMiddleware = require('../middleware/authmiddleware');
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');

// NORMAL USER ACCESS
const userAccess = [
    authMiddleware,
    accountTypeMiddleware('user')
];

// GET MY NOTIFICATIONS
router.get(
    '/getmynotifications',
    ...userAccess,
    getNotifications
);

// MARK NOTIFICATION AS READ
router.put(
    '/marknotificationread/:id',
    ...userAccess,
    markNotificationRead
);

module.exports = router;