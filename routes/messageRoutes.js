
const express = require('express');
const router = express.Router();

const {
    sendMessage,
    getConversation
} = require('../controller/messageController');

const authMiddleware = require('../middleware/authMiddleware');

const userOnly = (req, res, next) => {
    if (!req.user || req.user.accountType !== 'user') {
        return res.status(403).json({
            message: 'User account access required'
        });
    }

    next();
};

// SEND MESSAGE
router.post('/sendmessage', authMiddleware, userOnly, sendMessage);

// GET CONVERSATION
router.get('/getconversation/:receiverId', authMiddleware, userOnly, getConversation);

module.exports = router;
