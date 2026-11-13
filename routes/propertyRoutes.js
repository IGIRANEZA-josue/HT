
const express = require('express');
const router = express.Router();

const {
    Addproperty,
    Getallproperties,
    Get1property,
    Updateproperty,
    Deleteproperty,
    Addpropertyimage
} = require('../controller/propertycontroller');

const authMiddleware = require('../middleware/authMiddleware');

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

const authenticated = (req, res, next) => {
    authMiddleware(req, res, next);
};

// PUBLIC
router.get('/getallproperties', Getallproperties);
router.get('/getproperty/:id', Get1property);

// LANDLORD ONLY
router.post('/addproperty', authenticated, landlordOnly, Addproperty);
router.put('/updateproperty/:id', authenticated, landlordOnly, Updateproperty);
router.delete('/deleteproperty/:id', authenticated, landlordOnly, Deleteproperty);
router.post('/addpropertyimage', authenticated, landlordOnly, Addpropertyimage);

module.exports = router;
