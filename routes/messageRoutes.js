const router = require('express').Router();
const message = require('../controller/messageController');
const auth = require('../middleware/authMiddleware');
const protect = auth.authMiddleware || auth;

router.post('/messages', protect, message.sendMessage);
router.get('/messages/:userId', protect, message.getConversation);

module.exports = router;
