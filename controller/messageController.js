const db = require('../db/db.js');
exports.sendMessage = async (req,res) => {
 try {
  const {receiver_id,property_id,message}=req.body; if(!receiver_id || !message)return res.status(400).json({message:'receiver_id and message are required'});
  const [r]=await db.query('INSERT INTO messages (sender_id,receiver_id,property_id,message) VALUES (?,?,?,?)',[req.user.id,receiver_id,property_id || null,message]);
  res.status(201).json({message:'Message sent',messageId:r.insertId});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not send message'}); }
};
exports.getConversation = async (req,res) => {
 try { const id=req.params.userId; const [rows]=await db.query('SELECT * FROM messages WHERE (sender_id=? AND receiver_id=?) OR (sender_id=? AND receiver_id=?) ORDER BY sent_at',[req.user.id,id,id,req.user.id]); res.json(rows); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get conversation'}); }
};
