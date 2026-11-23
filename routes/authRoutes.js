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
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// NORMAL USER ACCESS
const userAccess = [
    authMiddleware,
    accountTypeMiddleware('user')
];

// ADMIN ACCESS
const adminAccess = [
    authMiddleware,
    accountTypeMiddleware('admin'),
    roleMiddleware('admin')
];

// PUBLIC ROUTES
router.post('/registeruser', Adduser);

router.post('/loginuser', Loginuser);

// NORMAL USER ROUTES
router.get('/getmyprofile', ...userAccess, Getmyprofile);

router.put('/updateuser', ...userAccess, Updateuser);

router.delete('/deleteuser', ...userAccess, Deleteuser);

// ADMIN USER MANAGEMENT ROUTES
router.get('/getallusers', ...adminAccess, Getallusers);

router.get('/getuser/:id', ...adminAccess, Get1user);

module.exports = router;