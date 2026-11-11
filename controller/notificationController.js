const db = require('../db/db.js');
exports.getNotifications = async (req,res) => {
 try { const [rows]=await db.query('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC',[req.user.id]); res.json(rows); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get notifications'}); }
};
exports.markNotificationRead = async (req,res) => {
 try { const [r]=await db.query('UPDATE notifications SET is_read=TRUE WHERE id=? AND user_id=?',[req.params.id,req.user.id]); if(!r.affectedRows)return res.status(404).json({message:'Notification not found'}); res.json({message:'Marked as read'}); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not update notification'}); }
};
