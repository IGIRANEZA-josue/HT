
const express = require('express');
const router = express.Router();

const {
    createAppointment,
    getMyAppointments
} = require('../controller/appointmentController');

const authMiddleware = require('../middleware/authMiddleware');

const userOnly = (req, res, next) => {
    if (!req.user || req.user.accountType !== 'user') {
        return res.status(403).json({
            message: 'User account access required'
        });
    }

    next();
};

// ADD APPOINTMENT
router.post('/addappointment', authMiddleware, userOnly, createAppointment);

// GET MY APPOINTMENTS
router.get('/getmyappointments', authMiddleware, userOnly, getMyAppointments);

module.exports = router;
