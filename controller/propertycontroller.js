const db = require('../db/db.js');
exports.getProperties = async (req,res) => {
 try { const [rows]=await db.query('SELECT p.*,l.province,l.district,l.sector,u.name AS landlord_name FROM properties p JOIN locations l ON p.location_id=l.id JOIN users u ON p.landlord_id=u.id ORDER BY p.created_at DESC'); res.json(rows); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get properties'}); }
};
exports.getProperty = async (req,res) => {
 try { const [p]=await db.query('SELECT * FROM properties WHERE id=?',[req.params.id]); if(!p.length)return res.status(404).json({message:'Property not found'}); const [images]=await db.query('SELECT * FROM property_images WHERE property_id=?',[req.params.id]); res.json({...p[0],images}); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get property'}); }
};
exports.addProperty = async (req,res) => {
 try {
  const {location_id,title,description,property_type,bedrooms,bathrooms,monthly_rent}=req.body;
  if(!location_id || !title || monthly_rent===undefined)return res.status(400).json({message:'location_id, title and monthly_rent are required'});
  if(req.user?.accountType!=='user' || req.user?.role!=='landlord')return res.status(403).json({message:'Only landlords can add properties'});
  const [r]=await db.query('INSERT INTO properties (landlord_id,location_id,title,description,property_type,bedrooms,bathrooms,monthly_rent) VALUES (?,?,?,?,?,?,?,?)',[req.user.id,location_id,title,description || null,property_type || 'House',bedrooms || 0,bathrooms || 0,monthly_rent]);
  res.status(201).json({message:'Property added',propertyId:r.insertId});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not add property'}); }
};
exports.updateProperty = async (req,res) => {
 try {
  const [p]=await db.query('SELECT landlord_id FROM properties WHERE id=?',[req.params.id]); if(!p.length)return res.status(404).json({message:'Property not found'});
  const owner=req.user?.accountType==='user' && Number(req.user.id)===Number(p[0].landlord_id);
  if(!owner && req.user?.accountType!=='admin')return res.status(403).json({message:'Not allowed'});
  const {location_id,title,description,property_type,bedrooms,bathrooms,monthly_rent,status}=req.body;
  await db.query('UPDATE properties SET location_id=?,title=?,description=?,property_type=?,bedrooms=?,bathrooms=?,monthly_rent=?,status=? WHERE id=?',[location_id,title,description,property_type,bedrooms,bathrooms,monthly_rent,status,req.params.id]);
  res.json({message:'Property updated'});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not update property'}); }
};
exports.deleteProperty = async (req,res) => {
 try {
  const [p]=await db.query('SELECT landlord_id FROM properties WHERE id=?',[req.params.id]); if(!p.length)return res.status(404).json({message:'Property not found'});
  const owner=req.user?.accountType==='user' && Number(req.user.id)===Number(p[0].landlord_id);
  if(!owner && req.user?.accountType!=='admin')return res.status(403).json({message:'Not allowed'});
  await db.query('DELETE FROM properties WHERE id=?',[req.params.id]); res.json({message:'Property deleted'});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not delete property'}); }
};
exports.addPropertyImage = async (req,res) => {
 try {
  const {image_url}=req.body; if(!image_url)return res.status(400).json({message:'image_url is required'});
  const [p]=await db.query('SELECT landlord_id FROM properties WHERE id=?',[req.params.id]); if(!p.length)return res.status(404).json({message:'Property not found'});
  const owner=req.user?.accountType==='user' && Number(req.user.id)===Number(p[0].landlord_id);
  if(!owner && req.user?.accountType!=='admin')return res.status(403).json({message:'Not allowed'});
  const [r]=await db.query('INSERT INTO property_images (property_id,image_url) VALUES (?,?)',[req.params.id,image_url]);
  res.status(201).json({message:'Image added',imageId:r.insertId});
 } catch(e) { console.error(e); res.status(500).json({message:'Could not add image'}); }
};
