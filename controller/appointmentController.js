
const db = require('../db/db.js');

// CREATE APPOINTMENT
exports.createAppointment = async (req, res) => {
    try {
        const { property_id, appointment_date } = req.body;

        if (!property_id || !appointment_date) {
            return res.status(400).json({
                message: 'property_id and appointment_date are required'
            });
        }

        const propertyId = Number(property_id);
        const appointmentDate = new Date(appointment_date);

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({ message: 'Invalid property ID' });
        }

        if (Number.isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ message: 'Invalid appointment date' });
        }

        if (req.user?.accountType !== 'user' || req.user?.role !== 'seeker') {
            return res.status(403).json({
                message: 'Only house seekers can request appointments'
            });
        }

        const [properties] = await db.query(
            'SELECT id, landlord_id, status FROM properties WHERE id = ?',
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({ message: 'Property not found' });
        }

        if (properties[0].status !== 'available') {
            return res.status(400).json({
                message: 'This property is not available'
            });
        }

        if (Number(properties[0].landlord_id) === Number(req.user.id)) {
            return res.status(400).json({
                message: 'You cannot book an appointment for your own property'
            });
        }

        const [result] = await db.query(
            `INSERT INTO viewing_appointments
             (property_id, seeker_id, landlord_id, appointment_date)
             VALUES (?, ?, ?, ?)`,
            [
                propertyId,
                req.user.id,
                properties[0].landlord_id,
                appointmentDate
            ]
        );

        return res.status(201).json({
            message: 'Appointment requested',
            appointmentId: result.insertId
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not create appointment'
        });
    }
};

// GET MY APPOINTMENTS
exports.getMyAppointments = async (req, res) => {
    try {
        const [appointments] = await db.query(
            `SELECT
                a.*,
                p.title AS property_title,
                seeker.name AS seeker_name,
                landlord.name AS landlord_name,
                CASE
                    WHEN a.seeker_id = ? THEN 'seeker'
                    ELSE 'landlord'
                END AS my_role
             FROM viewing_appointments a
             JOIN properties p ON a.property_id = p.id
             JOIN htracker seeker ON a.seeker_id = seeker.id
             JOIN htracker landlord ON a.landlord_id = landlord.id
             WHERE a.seeker_id = ? OR a.landlord_id = ?
             ORDER BY a.appointment_date ASC`,
            [req.user.id, req.user.id, req.user.id]
        );

        return res.status(200).json({
            message: 'Appointments retrieved successfully',
            appointments
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get appointments'
        });
    }
};
