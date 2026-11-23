
const db = require('../db/db.js');

// GET MY NOTIFICATIONS
exports.getNotifications = async (req, res) => {
    try {
        const [notifications] = await db.query(
            `SELECT *
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            message: 'Notifications retrieved successfully',
            notifications
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get notifications'
        });
    }
};

// MARK NOTIFICATION AS READ
exports.markNotificationRead = async (req, res) => {
    try {
        const notificationId = Number(req.params.id);

        if (!Number.isInteger(notificationId) || notificationId <= 0) {
            return res.status(400).json({
                message: 'Invalid notification ID'
            });
        }

        const [result] = await db.query(
            `UPDATE notifications
             SET is_read = TRUE
             WHERE id = ? AND user_id = ?`,
            [notificationId, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Notification not found'
            });
        }

        return res.status(200).json({
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not update notification'
        });
    }
};
