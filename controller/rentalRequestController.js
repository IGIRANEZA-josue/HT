
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

        const {
            property_id,
            message,
            rental_start_date,
            rental_end_date
        } = req.body;

        const propertyId = Number(property_id);

        // Validate property ID
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

        // Validate rental dates
        if (!rental_start_date || !rental_end_date) {
            return res.status(400).json({
                message: 'Rental start date and end date are required'
            });
        }

        // Check date format
        const startDate = new Date(rental_start_date);
        const endDate = new Date(rental_end_date);

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(rental_start_date) ||
            !/^\d{4}-\d{2}-\d{2}$/.test(rental_end_date) ||
            Number.isNaN(startDate.getTime()) ||
            Number.isNaN(endDate.getTime()) ||
            startDate.toISOString().slice(0, 10) !== rental_start_date ||
            endDate.toISOString().slice(0, 10) !== rental_end_date
        ) {
            return res.status(400).json({
                message: 'Please provide valid dates in YYYY-MM-DD format'
            });
        }

        if (rental_end_date <= rental_start_date) {
            return res.status(400).json({
                message: 'Rental end date must be after rental start date'
            });
        }

        const today = new Date().toISOString().slice(0, 10);

        if (rental_start_date < today) {
            return res.status(400).json({
                message: 'Rental start date cannot be in the past'
            });
        }

        // Check whether property exists
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

        // Prevent landlord from requesting own property
        if (Number(properties[0].landlord_id) === Number(req.user.id)) {
            return res.status(400).json({
                message: 'You cannot request your own property'
            });
        }

        // Insert rental request
        const [result] = await db.query(
            `INSERT INTO rental_requests
             (
                property_id,
                seeker_id,
                message,
                rental_start_date,
                rental_end_date
             )
             VALUES (?, ?, ?, ?, ?)`,
            [
                propertyId,
                req.user.id,
                message || null,
                rental_start_date,
                rental_end_date
            ]
        );

        return res.status(201).json({
            message: 'Rental request sent successfully',
            requestId: result.insertId,
            rental_period: {
                start_date: rental_start_date,
                end_date: rental_end_date
            }
        });

    } catch (error) {
        console.error('CREATE RENTAL REQUEST ERROR:', error);

        return res.status(500).json({
            message: 'Could not create rental request'
        });
    }
};


// GET MY RENTAL REQUESTS
// Returns submitted requests and requests received by landlords.
exports.getMyRentalRequests = async (req, res) => {
    try {

        // Requests submitted by the logged-in seeker
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

        // Requests received by the logged-in landlord
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
        console.error('GET RENTAL REQUESTS ERROR:', error);

        return res.status(500).json({
            message: 'Could not get rental requests'
        });
    }
};


// APPROVE OR REJECT RENTAL REQUEST
exports.updateRentalRequestStatus = async (req, res) => {

    const connection = await db.getConnection();

    try {
        const requestId = Number(req.params.id);
        const { status } = req.body;
        const landlordId = req.user.id;

        // Validate request ID
        if (!Number.isInteger(requestId) || requestId <= 0) {
            return res.status(400).json({
                message: 'Invalid rental request ID'
            });
        }

        // Validate status
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                message: 'Status must be approved or rejected'
            });
        }

        await connection.beginTransaction();

        // Lock property and retrieve request information
        const [requests] = await connection.query(
            `SELECT
                r.id,
                r.property_id,
                r.status AS request_status,
                r.rental_start_date,
                r.rental_end_date,
                p.landlord_id,
                p.status AS property_status
             FROM rental_requests r
             JOIN properties p ON r.property_id = p.id
             WHERE r.id = ?
             FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Rental request not found'
            });
        }

        const request = requests[0];

        // Check property ownership
        if (Number(request.landlord_id) !== Number(landlordId)) {
            await connection.rollback();

            return res.status(403).json({
                message: 'You do not own this property'
            });
        }

        // Check request status
        if (request.request_status !== 'pending') {
            await connection.rollback();

            return res.status(400).json({
                message: 'This request has already been processed'
            });
        }

        if (status === 'approved') {

            // Check property availability
            if (request.property_status !== 'available') {
                await connection.rollback();

                return res.status(400).json({
                    message: 'This property is no longer available'
                });
            }

            // Approve selected request
            await connection.query(
                `UPDATE rental_requests
                 SET status = 'approved'
                 WHERE id = ?`,
                [requestId]
            );

            // Reject other pending requests for the same property
            await connection.query(
                `UPDATE rental_requests
                 SET status = 'rejected'
                 WHERE property_id = ?
                 AND id != ?
                 AND status = 'pending'`,
                [request.property_id, requestId]
            );

            // Mark property as rented
            await connection.query(
                `UPDATE properties
                 SET status = 'rented'
                 WHERE id = ?`,
                [request.property_id]
            );

        } else {

            // Reject selected request
            await connection.query(
                `UPDATE rental_requests
                 SET status = 'rejected'
                 WHERE id = ?`,
                [requestId]
            );
        }

        await connection.commit();

        return res.status(200).json({
            message: status === 'approved'
                ? 'Rental request approved successfully'
                : 'Rental request rejected successfully',

            requestId: requestId,
            status: status
        });

    } catch (error) {

        await connection.rollback();

        console.error('UPDATE RENTAL REQUEST ERROR:', error);

        return res.status(500).json({
            message: 'Could not update rental request status'
        });

    } finally {
        connection.release();
    }
};
