const db = require('../db/db.js');
exports.createAppointment = async (req,res) => {
 try {
  const {property_id,appointment_date}=req.body; if(!property_id || !appointment_date)return res.status(400).json({message:'property_id and appointment_date are required'});
  const [p]=await db.query('SELECT landlord_id FROM properties WHERE id=?',[property_id]); if(!p.length)return res.status(404).json({message:'Property not found'});
  const [r]=await db.query('INSERT INTO viewing_appointments (property_id,seeker_id,landlord_id,appointment_date) VALUES (?,?,?,?)',[property_id,req.user.id,p[0].landlord_id,appointment_date]);
  res.status(201).json({message:'Appointment requested',appointmentId:r.insertId});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not create appointment'}); }
};
exports.getMyAppointments = async (req,res) => {
 try { const [rows]=await db.query('SELECT * FROM viewing_appointments WHERE seeker_id=? OR landlord_id=? ORDER BY appointment_date',[req.user.id,req.user.id]); res.json(rows); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get appointments'}); }
};
