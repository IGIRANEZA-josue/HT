
const express = require('express');
const router = express.Router();

const {
    createRentalRequest,
    getMyRentalRequests,
    updateRentalRequestStatus
} = require('../controller/rentalRequestController');

const authmiddleware = require('../middleware/authmiddleware');
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');


// CREATE RENTAL REQUEST - SEEKER
router.post(
    '/addrentalrequest',
    authmiddleware,
    accountTypeMiddleware('user'),
    roleMiddleware('seeker'),
    createRentalRequest
);


// GET MY RENTAL REQUESTS - SEEKER AND LANDLORD
router.get(
    '/getmyrentalrequests',
    authmiddleware,
    accountTypeMiddleware('user'),
    getMyRentalRequests
);


// APPROVE OR REJECT RENTAL REQUEST - LANDLORD
router.put(
    '/updaterequest/:id',
    authmiddleware,
    accountTypeMiddleware('user'),
    roleMiddleware('landlord'),
    updateRentalRequestStatus
);


module.exports = router;
