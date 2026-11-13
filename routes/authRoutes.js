
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

const authMiddleware = require('../middleware/authMiddleware');


// USER ONLY
const userOnly = (req, res, next) => {
    if (!req.user || req.user.accountType !== 'user') {
        return res.status(403).json({
            message: 'User account access required'
        });
    }

    next();
};


// ADMIN ONLY
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


// PUBLIC ROUTES
router.post('/registeruser', Adduser);
router.post('/loginuser', Loginuser);


// USER ROUTES
router.get('/getmyprofile', authMiddleware, userOnly, Getmyprofile);
router.put('/updateuser', authMiddleware, userOnly, Updateuser);
router.delete('/deleteuser', authMiddleware, userOnly, Deleteuser);


// ADMIN USER MANAGEMENT ROUTES
router.get('/getallusers', authMiddleware, adminOnly, Getallusers);
router.get('/getuser/:id', authMiddleware, adminOnly, Get1user);


module.exports = router;
