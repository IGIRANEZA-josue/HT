const router = require('express').Router();
const requests = require('../controller/rentalRequestController');
const auth = require('../middleware/authMiddleware');
const protect = auth.authMiddleware || auth;

router.post('/rental-requests', protect, requests.createRentalRequest);
router.get('/rental-requests/my', protect, requests.getMyRentalRequests);

module.exports = router;
