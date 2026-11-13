
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

const authMiddleware = require('../middleware/authmiddleware');


// Ensure the token belongs to an administrator
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


// PUBLIC ADMIN LOGIN
router.post('/login', Loginadmin);


// PROTECTED ADMIN ROUTES
router.post('/register', authMiddleware, adminOnly, Addadmin);

router.get('/me', authMiddleware, adminOnly, Getmyadmin);

router.get('/', authMiddleware, adminOnly, Getalladmins);

router.get('/:id', authMiddleware, adminOnly, Get1admin);

router.delete('/:id', authMiddleware, adminOnly, Deleteadmin);


module.exports = router;
