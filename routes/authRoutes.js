
const express = require('express');
const router = express.Router();

const {
    Adduser,
    Loginuser,
    Getmyprofile,
    Updateuser,
    Getallusers,
    Get1user,
    Deleteuser
} = require('../controller/usercontroller');

const authMiddleware = require('../middleware/authmiddleware');


// Check that the token belongs to a normal user
const userOnly = (req, res, next) => {
    if (!req.user || req.user.accountType !== 'user') {
        return res.status(403).json({
            message: 'User account access required'
        });
    }

    next();
};


// Check that the token belongs to an admin
const adminOnly = (req, res, next) => {
    if (!req.user || req.user.accountType !== 'admin') {
        return res.status(403).json({
            message: 'Administrator access required'
        });
    }

    next();
};


// PUBLIC ROUTES
router.post('/register', Adduser);
router.post('/login', Loginuser);


// USER TOKEN ROUTES
router.get('/me', authMiddleware, userOnly, Getmyprofile);
router.put('/me', authMiddleware, userOnly, Updateuser);
router.delete('/me', authMiddleware, userOnly, Deleteuser);


// ADMIN-ONLY USER MANAGEMENT
router.get('/', authMiddleware, adminOnly, Getallusers);
router.get('/:id', authMiddleware, adminOnly, Get1user);


module.exports = router;
