
const db = require('../db/db.js');

// CREATE RENTAL REQUEST
exports.createRentalRequest = async (req, res) => {
    try {
        if (
            req.user?.accountType !== 'user' ||
            req.user?.role !== 'seeker'
        ) {
            return res.status(403).json({
                message: 'Only house seekers can send rental requests'
            });
        }

        const { property_id, message } = req.body;
        const propertyId = Number(property_id);

        if (!property_id) {
            return res.status(400).json({
                message: 'property_id is required'
            });
        }

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({
                message: 'Invalid property ID'
            });
        }

        const [properties] = await db.query(
            `SELECT id, landlord_id, status
             FROM properties
             WHERE id = ?`,
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                message: 'Property not found'
            });
        }

        if (properties[0].status !== 'available') {
            return res.status(400).json({
                message: 'This property is not available'
            });
        }

        if (Number(properties[0].landlord_id) === Number(req.user.id)) {
            return res.status(400).json({
                message: 'You cannot request your own property'
            });
        }

        const [result] = await db.query(
            `INSERT INTO rental_requests
             (property_id, seeker_id, message)
             VALUES (?, ?, ?)`,
            [propertyId, req.user.id, message || null]
        );

        return res.status(201).json({
            message: 'Rental request sent successfully',
            requestId: result.insertId
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not create rental request'
        });
    }
};

// GET MY RENTAL REQUESTS
// Returns requests submitted by the user and requests received
// for properties owned by the user.
exports.getMyRentalRequests = async (req, res) => {
    try {
        const [submitted] = await db.query(
            `SELECT
                r.*,
                p.title AS property_title,
                p.monthly_rent,
                landlord.name AS landlord_name
             FROM rental_requests r
             JOIN properties p ON r.property_id = p.id
             JOIN htracker landlord ON p.landlord_id = landlord.id
             WHERE r.seeker_id = ?
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );

        const [received] = await db.query(
            `SELECT
                r.*,
                p.title AS property_title,
                p.monthly_rent,
                seeker.name AS seeker_name,
                seeker.email AS seeker_email
             FROM rental_requests r
             JOIN properties p ON r.property_id = p.id
             JOIN htracker seeker ON r.seeker_id = seeker.id
             WHERE p.landlord_id = ?
             ORDER BY r.created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            message: 'Rental requests retrieved successfully',
            submitted,
            received
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get rental requests'
        });
    }
};
