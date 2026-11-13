const router = require('express').Router();
const appointment = require('../controller/appointmentController');
const auth = require('../middleware/authmiddleware');
const protect = auth.authMiddleware || auth;

router.post('/appointments', protect, appointment.createAppointment);
router.get('/appointments/my', protect, appointment.getMyAppointments);

module.exports = router;
