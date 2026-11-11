const router = require('express').Router();
const notification = require('../controller/notificationController');
const auth = require('../middleware/authMiddleware');
const protect = auth.authMiddleware || auth;

router.get('/notifications', protect, notification.getNotifications);
router.patch('/notifications/:id/read', protect, notification.markNotificationRead);

module.exports = router;
