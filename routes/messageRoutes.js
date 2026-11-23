const express = require('express');
const router = express.Router();

const {
    sendMessage,
    getConversation
} = require('../controller/messageController');

const authMiddleware = require('../middleware/authmiddleware');
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');

// NORMAL USER ACCESS
const userAccess = [
    authMiddleware,
    accountTypeMiddleware('user')
];

// SEND MESSAGE
router.post(
    '/sendmessage',
    ...userAccess,
    sendMessage
);

// GET CONVERSATION
router.get(
    '/getconversation/:receiverId',
    ...userAccess,
    getConversation
);

module.exports = router;