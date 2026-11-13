const router = require('express').Router();
const location = require('../controller/locationcontroller');
const auth = require('../middleware/authmiddleware');
const protect = auth.authMiddleware || auth;

router.get('/locations', location.getLocations);
router.post('/locations', protect, location.addLocation);

module.exports = router;
