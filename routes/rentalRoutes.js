const express = require('express');
const router = express.Router();

const {
    createRentalRequest,
    getMyRentalRequests
} = require('../controller/rentalRequestController');

const authMiddleware = require('../middleware/authmiddleware');
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// NORMAL USER ACCESS
const userAccess = [
    authMiddleware,
    accountTypeMiddleware('user')
];

// SEEKER ONLY: CREATE RENTAL REQUEST
router.post(
    '/addrentalrequest',
    ...userAccess,
    roleMiddleware('seeker'),
    createRentalRequest
);

// SEEKERS AND LANDLORDS: VIEW RENTAL REQUESTS
router.get(
    '/getmyrentalrequests',
    ...userAccess,
    getMyRentalRequests
);

module.exports = router;