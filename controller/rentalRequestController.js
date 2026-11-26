
const db = require('../db/db.js');

// VALIDATE DATE FORMAT: YYYY-MM-DD
const isValidDate = (date) => {
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    return !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.toISOString().slice(0, 10) === date;
};


// GET TODAY'S DATE USING RWANDA TIME
const getToday = () => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Kigali',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const dateParts = {};

    parts.forEach(part => {
        dateParts[part.type] = part.value;
    });

    return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};


// CREATE RENTAL REQUEST
exports.createRentalRequest = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        // Only seekers can send rental requests
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
        } = req.body || {};

        const propertyId = Number(property_id);

        // Validate property ID
        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({
                message: 'Invalid property ID'
            });
        }

        // Validate rental dates
        if (
            !isValidDate(rental_start_date) ||
            !isValidDate(rental_end_date)
        ) {
            return res.status(400).json({
                message: 'Please provide valid rental dates in YYYY-MM-DD format'
            });
        }

        // Rental end date must be after start date
        if (rental_end_date <= rental_start_date) {
            return res.status(400).json({
                message: 'Rental end date must be after rental start date'
            });
        }

        // Start date cannot be in the past
        if (rental_start_date < getToday()) {
            return res.status(400).json({
                message: 'Rental start date cannot be in the past'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // Lock the property while processing the request
        const [properties] = await connection.query(
            `SELECT id, landlord_id, status
             FROM properties
             WHERE id = ?
             FOR UPDATE`,
            [propertyId]
        );

        if (properties.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                message: 'Property not found'
            });
        }

        const property = properties[0];

        // Do not allow requests for rented properties
        if (property.status !== 'available') {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: 'This property is no longer available for rental requests'
            });
        }

        // Prevent landlord from requesting own property
        if (Number(property.landlord_id) === Number(req.user.id)) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: 'You cannot request your own property'
            });
        }

        // Prevent duplicate pending requests
        const [existingRequests] = await connection.query(
            `SELECT id
             FROM rental_requests
             WHERE property_id = ?
             AND seeker_id = ?
             AND status = 'pending'
             LIMIT 1`,
            [propertyId, req.user.id]
        );

        if (existingRequests.length > 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(409).json({
                message: 'You already have a pending request for this property'
            });
        }

        // Insert rental request
        const [result] = await connection.query(
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

        await connection.commit();
        transactionStarted = false;

        return res.status(201).json({
            message: 'Rental request sent successfully',
            requestId: result.insertId,
            rental_period: {
                start_date: rental_start_date,
                end_date: rental_end_date
            }
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error('CREATE RENTAL REQUEST ERROR:', error);

        return res.status(500).json({
            message: 'Could not create rental request'
        });

    } finally {
        if (connection) {
            connection.release();
        }
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
    let connection;
    let transactionStarted = false;

    try {
        // Only landlords can approve or reject requests
        if (
            req.user?.accountType !== 'user' ||
            req.user?.role !== 'landlord'
        ) {
            return res.status(403).json({
                message: 'Only landlords can update rental requests'
            });
        }

        const requestId = Number(req.params.id);
        const { status } = req.body || {};

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

        connection = await db.getConnection();

        await connection.beginTransaction();
        transactionStarted = true;

        // First find the property connected to this request
        const [requestInfo] = await connection.query(
            `SELECT property_id
             FROM rental_requests
             WHERE id = ?`,
            [requestId]
        );

        if (requestInfo.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                message: 'Rental request not found'
            });
        }

        const propertyId = requestInfo[0].property_id;

        // Lock the property first.
        // This prevents two requests for the same property
        // from being approved at the same time.
        const [properties] = await connection.query(
            `SELECT id, landlord_id, status
             FROM properties
             WHERE id = ?
             FOR UPDATE`,
            [propertyId]
        );

        if (properties.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                message: 'Property not found'
            });
        }

        const property = properties[0];

        // Check whether the logged-in landlord owns the property
        if (Number(property.landlord_id) !== Number(landlordId)) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(403).json({
                message: 'You do not own this property'
            });
        }

        // Lock and retrieve the selected request
        const [requests] = await connection.query(
            `SELECT id, property_id, status
             FROM rental_requests
             WHERE id = ?
             FOR UPDATE`,
            [requestId]
        );

        if (requests.length === 0) {
            await connection.rollback();
            transactionStarted = false;

            return res.status(404).json({
                message: 'Rental request not found'
            });
        }

        const request = requests[0];

        // Make sure the request has not already been processed
        if (request.status !== 'pending') {
            await connection.rollback();
            transactionStarted = false;

            return res.status(400).json({
                message: 'This request has already been processed'
            });
        }

        if (status === 'approved') {

            // Check property availability
            if (property.status !== 'available') {
                await connection.rollback();
                transactionStarted = false;

                return res.status(400).json({
                    message: 'This property is already rented or unavailable'
                });
            }

            // Approve selected request
            await connection.query(
                `UPDATE rental_requests
                 SET status = 'approved'
                 WHERE id = ?`,
                [requestId]
            );

            // Reject all other pending requests for this property
            await connection.query(
                `UPDATE rental_requests
                 SET status = 'rejected'
                 WHERE property_id = ?
                 AND id != ?
                 AND status = 'pending'`,
                [propertyId, requestId]
            );

            // Mark property as rented
            await connection.query(
                `UPDATE properties
                 SET status = 'rented'
                 WHERE id = ?`,
                [propertyId]
            );

        } else {

            // Reject only the selected request
            await connection.query(
                `UPDATE rental_requests
                 SET status = 'rejected'
                 WHERE id = ?`,
                [requestId]
            );
        }

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            message: status === 'approved'
                ? 'Rental request approved successfully. Other pending requests for this property have been rejected.'
                : 'Rental request rejected successfully',

            requestId,
            propertyId,
            status
        });

    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error('UPDATE RENTAL REQUEST ERROR:', error);

        return res.status(500).json({
            message: 'Could not update rental request status'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
