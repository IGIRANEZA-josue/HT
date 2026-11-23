const express = require('express');
const router = express.Router();

const {
    createAppointment,
    getMyAppointments
} = require('../controller/appointmentController');

const authMiddleware = require('../middleware/authmiddleware');
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// NORMAL USER ACCESS
const userAccess = [
    authMiddleware,
    accountTypeMiddleware('user')
];

// SEEKER ONLY: CREATE APPOINTMENT
router.post(
    '/addappointment',
    ...userAccess,
    roleMiddleware('seeker'),
    createAppointment
);

// SEEKERS AND LANDLORDS: VIEW APPOINTMENTS
router.get(
    '/getmyappointments',
    ...userAccess,
    getMyAppointments
);

module.exports = router;