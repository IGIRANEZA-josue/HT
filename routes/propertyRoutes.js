const express = require('express');
const router = express.Router();

const {
    getProperties,
    getProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    addPropertyImage
} = require('../controller/propertyController');

const authMiddleware = require('../middleware/authmiddleware');
const accountTypeMiddleware = require('../middleware/accountTypeMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// LANDLORD ACCESS
const landlordAccess = [
    authMiddleware,
    accountTypeMiddleware('user'),
    roleMiddleware('landlord')
];

// PUBLIC ROUTES
router.get('/getallproperties', getProperties);

router.get('/getproperty/:id', getProperty);

// LANDLORD ONLY
router.post(
    '/addproperty',
    ...landlordAccess,
    addProperty
);

// AUTHENTICATED ROUTES
// Controllers must check property ownership or admin permissions.

router.put(
    '/updateproperty/:id',
    authMiddleware,
    updateProperty
);

router.delete(
    '/deleteproperty/:id',
    authMiddleware,
    deleteProperty
);

router.post(
    '/addpropertyimage/:id',
    authMiddleware,
    addPropertyImage
);

module.exports = router;