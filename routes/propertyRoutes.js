
const express = require('express');
const router = express.Router();

const {
    getProperties,
    getProperty,
    addProperty,
    updateProperty,
    deleteProperty,
    addPropertyImage
} = require('../controller/propertycontroller');

const authMiddleware = require('../middleware/authMiddleware');


// LANDLORD ONLY
const landlordOnly = (req, res, next) => {
    if (
        !req.user ||
        req.user.accountType !== 'user' ||
        req.user.role !== 'landlord'
    ) {
        return res.status(403).json({
            message: 'Landlord access required'
        });
    }

    next();
};


// PUBLIC ROUTES
router.get('/getallproperties', getProperties);
router.get('/getproperty/:id', getProperty);


// LANDLORD ROUTE
router.post(
    '/addproperty',
    authMiddleware,
    landlordOnly,
    addProperty
);


// AUTHENTICATED ROUTES
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
