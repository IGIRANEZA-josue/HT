const router = require('express').Router();
const property = require('../controller/propertycontroller');
const auth = require('../middleware/authMiddleware');
const protect = auth.authMiddleware || auth;

router.get('/properties', property.getProperties);
router.get('/properties/:id', property.getProperty);
router.post('/properties', protect, property.addProperty);
router.put('/properties/:id', protect, property.updateProperty);
router.delete('/properties/:id', protect, property.deleteProperty);
router.post('/properties/:id/images', protect, property.addPropertyImage);

module.exports = router;
