const db = require('../db/db.js');
exports.addFavorite = async (req,res) => {
 try { await db.query('INSERT INTO favorites (user_id,property_id) VALUES (?,?)',[req.user.id,req.params.propertyId]); res.status(201).json({message:'Added to favorites'}); }
 catch(e) { if(e.code==='ER_DUP_ENTRY')return res.status(409).json({message:'Already in favorites'}); console.error(e); res.status(500).json({message:'Could not add favorite'}); }
};
exports.getFavorites = async (req,res) => {
 try { const [rows]=await db.query('SELECT p.* FROM favorites f JOIN properties p ON f.property_id=p.id WHERE f.user_id=?',[req.user.id]); res.json(rows); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not get favorites'}); }
};
exports.removeFavorite = async (req,res) => {
 try { await db.query('DELETE FROM favorites WHERE user_id=? AND property_id=?',[req.user.id,req.params.propertyId]); res.json({message:'Favorite removed'}); }
 catch(e) { console.error(e); res.status(500).json({message:'Could not remove favorite'}); }
};
