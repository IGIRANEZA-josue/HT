const express = require('express');
const router = express.Router();

const {
    getLocations,
    addLocation
} = require('../controller/locationController');

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
router.get('/getalllocations', getLocations);

// ADMIN ONLY
router.post(
    '/addlocation',
    ...adminAccess,
    addLocation
);

module.exports = router;