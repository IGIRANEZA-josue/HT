
const db = require('../db/db.js');

// SEND MESSAGE
exports.sendMessage = async (req, res) => {
    try {
        const { receiver_id, property_id, message } = req.body;

        if (!receiver_id || !message || !message.trim()) {
            return res.status(400).json({
                message: 'receiver_id and message are required'
            });
        }

        const receiverId = Number(receiver_id);

        if (!Number.isInteger(receiverId) || receiverId <= 0) {
            return res.status(400).json({
                message: 'Invalid receiver ID'
            });
        }

        if (receiverId === Number(req.user.id)) {
            return res.status(400).json({
                message: 'You cannot send a message to yourself'
            });
        }

        const [receivers] = await db.query(
            'SELECT id FROM htracker WHERE id = ?',
            [receiverId]
        );

        if (receivers.length === 0) {
            return res.status(404).json({
                message: 'Receiver not found'
            });
        }

        let propertyId = null;

        if (property_id !== undefined && property_id !== null && property_id !== '') {
            propertyId = Number(property_id);

            if (!Number.isInteger(propertyId) || propertyId <= 0) {
                return res.status(400).json({
                    message: 'Invalid property ID'
                });
            }

            const [properties] = await db.query(
                'SELECT id FROM properties WHERE id = ?',
                [propertyId]
            );

            if (properties.length === 0) {
                return res.status(404).json({
                    message: 'Property not found'
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO messages
             (sender_id, receiver_id, property_id, message)
             VALUES (?, ?, ?, ?)`,
            [req.user.id, receiverId, propertyId, message.trim()]
        );

        return res.status(201).json({
            message: 'Message sent successfully',
            messageId: result.insertId
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not send message'
        });
    }
};

// GET CONVERSATION WITH ANOTHER USER
exports.getConversation = async (req, res) => {
    try {
        const receiverId = Number(req.params.receiverId);

        if (!Number.isInteger(receiverId) || receiverId <= 0) {
            return res.status(400).json({
                message: 'Invalid receiver ID'
            });
        }

        const [users] = await db.query(
            'SELECT id FROM htracker WHERE id = ?',
            [receiverId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const [messages] = await db.query(
            `SELECT
                m.*,
                sender.name AS sender_name,
                receiver.name AS receiver_name,
                p.title AS property_title
             FROM messages m
             JOIN htracker sender ON m.sender_id = sender.id
             JOIN htracker receiver ON m.receiver_id = receiver.id
             LEFT JOIN properties p ON m.property_id = p.id
             WHERE
                (m.sender_id = ? AND m.receiver_id = ?)
                OR
                (m.sender_id = ? AND m.receiver_id = ?)
             ORDER BY m.sent_at ASC`,
            [req.user.id, receiverId, receiverId, req.user.id]
        );

        return res.status(200).json({
            message: 'Conversation retrieved successfully',
            messages
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get conversation'
        });
    }
};
