const db = require('../db/db.js');
exports.createRentalRequest = async (req,res) => {
 try {
  if(req.user?.accountType!=='user' || req.user?.role!=='seeker')return res.status(403).json({message:'Only house seekers can send rental requests'});
  const {property_id,message}=req.body; if(!property_id)return res.status(400).json({message:'property_id is required'});
  const [r]=await db.query('INSERT INTO rental_requests (property_id,seeker_id,message) VALUES (?,?,?)',[property_id,req.user.id,message || null]);
  res.status(201).json({message:'Rental request sent',requestId:r.insertId});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not create rental request'}); }
};
exports.getMyRentalRequests = async (req,res) => {
 try { const [rows]=await db.query('SELECT * FROM rental_requests WHERE seeker_id=? ORDER BY created_at DESC',[req.user.id]); res.json(rows); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get requests'}); }
};
