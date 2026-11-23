
const db = require('../db/db.js');

// ADD FAVORITE
exports.addFavorite = async (req, res) => {
    try {
        const propertyId = Number(req.params.propertyId);

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({ message: 'Invalid property ID' });
        }

        const [properties] = await db.query(
            'SELECT id FROM properties WHERE id = ?',
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({ message: 'Property not found' });
        }

        await db.query(
            'INSERT INTO favorites (user_id, property_id) VALUES (?, ?)',
            [req.user.id, propertyId]
        );

        return res.status(201).json({ message: 'Added to favorites' });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Already in favorites'
            });
        }

        console.error(error);
        return res.status(500).json({
            message: 'Could not add favorite'
        });
    }
};

// GET MY FAVORITES
exports.getFavorites = async (req, res) => {
    try {
        const [favorites] = await db.query(
            `SELECT
                f.id AS favorite_id,
                f.created_at AS favorited_at,
                p.*,
                l.province,
                l.district,
                l.sector,
                l.cell_name,
                l.village,
                l.strreet_address AS street_address,
                u.name AS landlord_name,
                (SELECT pi.image_url
                 FROM property_images pi
                 WHERE pi.property_id = p.id
                 ORDER BY pi.id LIMIT 1) AS image_url
             FROM favorites f
             JOIN properties p ON f.property_id = p.id
             JOIN location l ON p.location_id = l.id
             JOIN htracker u ON p.landlord_id = u.id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            message: 'Favorites retrieved successfully',
            favorites
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get favorites'
        });
    }
};

// REMOVE FAVORITE
exports.removeFavorite = async (req, res) => {
    try {
        const propertyId = Number(req.params.propertyId);

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({ message: 'Invalid property ID' });
        }

        const [result] = await db.query(
            'DELETE FROM favorites WHERE user_id = ? AND property_id = ?',
            [req.user.id, propertyId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Favorite not found'
            });
        }

        return res.status(200).json({ message: 'Favorite removed' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not remove favorite'
        });
    }
};
