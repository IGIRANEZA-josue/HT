
const db = require('../db/db.js');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generatetoken');


// REUSABLE FUNCTION: GET USER WITH ALL RELATED INFORMATION
const getUserWithRelations = async (userId, existingUser = null) => {

    // Get user information
    let user = existingUser;

    if (!user) {
        const [users] = await db.query(
            `SELECT id, name, usern, email, role, department
             FROM htracker
             WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return null;
        }

        user = users[0];
    }

    // Get all related information
    const [
        propertiesResult,
        favoritesResult,
        sentMessagesResult,
        receivedMessagesResult,
        notificationsResult,
        submittedRequestsResult,
        receivedRequestsResult,
        appointmentsResult
    ] = await Promise.all([

        // 1. Properties owned by user
        db.query(
            `SELECT
                p.*,
                l.province,
                l.district,
                l.sector,
                l.cell_name,
                l.village,
                l.strreet_address
             FROM properties p
             LEFT JOIN location l ON p.location_id = l.id
             WHERE p.landlord_id = ?`,
            [userId]
        ),

        // 2. Favorite properties
        db.query(
            `SELECT
                f.id AS favorite_id,
                f.created_at AS favorited_at,
                p.id AS property_id,
                p.title,
                p.description,
                p.monthly_rent,
                p.status,
                p.property_type,
                p.landlord_id
             FROM favorites f
             JOIN properties p ON f.property_id = p.id
             WHERE f.user_id = ?`,
            [userId]
        ),

        // 3. Messages sent by user
        db.query(
            `SELECT
                m.*,
                receiver.name AS receiver_name,
                p.title AS property_title
             FROM messages m
             JOIN htracker receiver ON m.receiver_id = receiver.id
             LEFT JOIN properties p ON m.property_id = p.id
             WHERE m.sender_id = ?
             ORDER BY m.sent_at DESC`,
            [userId]
        ),

        // 4. Messages received by user
        db.query(
            `SELECT
                m.*,
                sender.name AS sender_name,
                p.title AS property_title
             FROM messages m
             JOIN htracker sender ON m.sender_id = sender.id
             LEFT JOIN properties p ON m.property_id = p.id
             WHERE m.receiver_id = ?
             ORDER BY m.sent_at DESC`,
            [userId]
        ),

        // 5. Notifications
        db.query(
            `SELECT *
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        ),

        // 6. Rental requests submitted by user
        db.query(
            `SELECT
                rr.*,
                p.title AS property_title,
                p.monthly_rent,
                landlord.name AS landlord_name
             FROM rental_requests rr
             JOIN properties p ON rr.property_id = p.id
             JOIN htracker landlord ON p.landlord_id = landlord.id
             WHERE rr.seeker_id = ?
             ORDER BY rr.created_at DESC`,
            [userId]
        ),

        // 7. Rental requests received by user as landlord
        db.query(
            `SELECT
                rr.*,
                p.title AS property_title,
                seeker.name AS seeker_name
             FROM rental_requests rr
             JOIN properties p ON rr.property_id = p.id
             JOIN htracker seeker ON rr.seeker_id = seeker.id
             WHERE p.landlord_id = ?
             ORDER BY rr.created_at DESC`,
            [userId]
        ),

        // 8. Viewing appointments (as seeker or landlord)
        db.query(
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
             ORDER BY a.appointment_date DESC`,
            [userId, userId, userId]
        )
    ]);

    const properties = propertiesResult[0];
    const favorites = favoritesResult[0];
    const sentMessages = sentMessagesResult[0];
    const receivedMessages = receivedMessagesResult[0];
    const notifications = notificationsResult[0];
    const submittedRequests = submittedRequestsResult[0];
    const receivedRequests = receivedRequestsResult[0];
    const appointments = appointmentsResult[0];

    // Get images belonging to the user's properties
    if (properties.length > 0) {
        const propertyIds = properties.map(property => property.id);

        const [images] = await db.query(
            `SELECT property_id, image_url
             FROM property_images
             WHERE property_id IN (?)`,
            [propertyIds]
        );

        // Attach images to their respective properties
        properties.forEach(property => {
            property.images = images
                .filter(image => image.property_id === property.id)
                .map(image => image.image_url);
        });
    }

    // Return complete user information
    return {
        ...user,

        properties,

        favorites,

        messages: {
            sent: sentMessages,
            received: receivedMessages
        },

        notifications,

        rental_requests: {
            submitted: submittedRequests,
            received: receivedRequests
        },

        appointments
    };
};


// REGISTER USER
const Adduser = async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({
                message: 'Invalid email address'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters'
            });
        }

        const userRole = role || 'seeker';

        if (!['seeker', 'landlord'].includes(userRole)) {
            return res.status(400).json({
                message: 'Role must be seeker or landlord'
            });
        }

        const [existing] = await db.query(
            'SELECT id FROM htracker WHERE usern = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO htracker
            (name, usern, email, pass, role, department)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                name,
                username,
                email,
                hashedPassword,
                userRole,
                'General'
            ]
        );

        return res.status(201).json({
            message: 'Registration successful',
            userId: result.insertId
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Registration failed'
        });
    }
};


// LOGIN USER
const Loginuser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM htracker WHERE usern = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.pass
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const token = generateToken(
            user.id,
            user.role,
            'user'
        );

        return res.status(200).json({
            message: 'Login successful',
            token
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Login failed'
        });
    }
};


// GET MY PROFILE WITH ALL RELATED INFORMATION
const Getmyprofile = async (req, res) => {
    try {
        const user = await getUserWithRelations(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Profile retrieved successfully',
            user
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not retrieve profile'
        });
    }
};


// UPDATE MY PROFILE
const Updateuser = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: 'Name and email are required'
            });
        }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({
                message: 'Invalid email address'
            });
        }

        const [existing] = await db.query(
            `SELECT id FROM htracker
             WHERE email = ? AND id != ?`,
            [email, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Email already exists'
            });
        }

        await db.query(
            `UPDATE htracker
             SET name = ?, email = ?
             WHERE id = ?`,
            [name, email, req.user.id]
        );

        return res.status(200).json({
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not update profile'
        });
    }
};


// GET ALL USERS WITH ALL RELATED INFORMATION (ADMIN ONLY)
const Getallusers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, name, usern, email, role, department
             FROM htracker
             ORDER BY id DESC`
        );

        const completeUsers = await Promise.all(
            users.map(user =>
                getUserWithRelations(user.id, user)
            )
        );

        return res.status(200).json({
            message: 'Users and their related information retrieved successfully',
            totalUsers: completeUsers.length,
            users: completeUsers
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not retrieve users'
        });
    }
};


// GET ONE USER WITH ALL RELATED INFORMATION (ADMIN ONLY)
const Get1user = async (req, res) => {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        const user = await getUserWithRelations(userId);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'User and related information retrieved successfully',
            user
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not retrieve user'
        });
    }
};


// DELETE MY ACCOUNT
const Deleteuser = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM htracker WHERE id = ?',
            [req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not delete account. Check related records.'
        });
    }
};


module.exports = {
    Adduser,
    Loginuser,
    Getmyprofile,
    Updateuser,
    Getallusers,
    Get1user,
    Deleteuser
};
