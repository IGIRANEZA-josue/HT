
const express = require('express');
const router = express.Router();

const {
    Addadmin,
    Loginadmin,
    Getmyadmin,
    Getalladmins,
    Get1admin,
    Deleteadmin
} = require('../controller/admincontroller');

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
router.post('/loginadmin', Loginadmin);

// ADMIN ONLY
router.post('/addadmin', authMiddleware, adminOnly, Addadmin);
router.get('/getmyadmin', authMiddleware, adminOnly, Getmyadmin);
router.get('/getalladmins', authMiddleware, adminOnly, Getalladmins);
router.get('/getadmin/:id', authMiddleware, adminOnly, Get1admin);
router.delete('/deleteadmin/:id', authMiddleware, adminOnly, Deleteadmin);

module.exports = router;
