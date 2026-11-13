
const express = require('express');
const router = express.Router();

const {
    Addmessage,
    Getconversation
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

router.post('/sendmessage', authMiddleware, userOnly, Addmessage);
router.get('/getconversation/:receiverId', authMiddleware, userOnly, Getconversation);

module.exports = router;
