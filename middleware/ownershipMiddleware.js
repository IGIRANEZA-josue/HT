
const db = require('../db/db.js');

const ownershipMiddleware = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Please login first.'
            });
        }

        const propertyId = req.params.id;

        if (!propertyId) {
            return res.status(400).json({
                message: 'Property ID is required.'
            });
        }

        const [properties] = await db.query(
            'SELECT landlord_id FROM properties WHERE id = ?',
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                message: 'Property not found.'
            });
        }

        if (
            req.user.role !== 'admin' &&
            (
                req.user.role !== 'landlord' ||
                Number(properties[0].landlord_id) !== Number(req.user.id)
            )
        ) {
            return res.status(403).json({
                message: 'You cannot manage this property.'
            });
        }

        next();

    } catch (error) {
        return res.status(500).json({
            message: 'Error checking property ownership.',
            error: error.message
        });
    }
};

module.exports = ownershipMiddleware;
