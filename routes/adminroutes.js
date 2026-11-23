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
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ADMIN ACCESS
const adminAccess = [
    authMiddleware,
    accountTypeMiddleware('admin'),
    roleMiddleware('admin')
];

// PUBLIC ROUTE
router.post('/loginadmin', Loginadmin);

// ADMIN ONLY ROUTES
router.post('/addadmin', ...adminAccess, Addadmin);

router.get('/getmyadmin', ...adminAccess, Getmyadmin);

router.get('/getalladmins', ...adminAccess, Getalladmins);

router.get('/getadmin/:id', ...adminAccess, Get1admin);

router.delete('/deleteadmin/:id', ...adminAccess, Deleteadmin);

module.exports = router;