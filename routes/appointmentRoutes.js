
const express = require('express');
const router = express.Router();

const {
    Addappointment,
    Getmyappointments
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

router.post('/addappointment', authMiddleware, userOnly, Addappointment);
router.get('/getmyappointments', authMiddleware, userOnly, Getmyappointments);

module.exports = router;
