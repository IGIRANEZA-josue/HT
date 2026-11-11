const db = require('../db/db.js');
exports.getLocations = async (req,res) => {
 try { const [rows]=await db.query('SELECT * FROM location ORDER BY district,sector'); res.json(rows); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get locations'}); }
};
exports.addLocation = async (req,res) => {
 try {
  const {province,district,sector,cell_name,village,street_address}=req.body;
  if(!province || !district)return res.status(400).json({message:'Province and district are required'});
  const [r]=await db.query('INSERT INTO location (province,district,sector,cell_name,village,street_address) VALUES (?,?,?,?,?,?)',[province,district,sector || null,cell_name || null,village || null,street_address || null]);
  res.status(201).json({message:'Location added',locationId:r.insertId});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not add location'}); }
};
