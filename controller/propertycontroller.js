
const db = require('../db/db.js');

// GET ALL PROPERTIES
exports.getProperties = async (req, res) => {
    try {
        const [properties] = await db.query(
            `SELECT
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
                 ORDER BY pi.id
                 LIMIT 1) AS image_url
             FROM properties p
             JOIN location l ON p.location_id = l.id
             JOIN htracker u ON p.landlord_id = u.id
             ORDER BY p.created_at DESC`
        );

        return res.status(200).json({
            message: 'Properties retrieved successfully',
            properties
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get properties'
        });
    }
};

// GET ONE PROPERTY
exports.getProperty = async (req, res) => {
    try {
        const propertyId = Number(req.params.id);

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({
                message: 'Invalid property ID'
            });
        }

        const [properties] = await db.query(
            `SELECT
                p.*,
                l.province,
                l.district,
                l.sector,
                l.cell_name,
                l.village,
                l.strreet_address AS street_address,
                u.name AS landlord_name,
                u.usern AS landlord_username
             FROM properties p
             JOIN location l ON p.location_id = l.id
             JOIN htracker u ON p.landlord_id = u.id
             WHERE p.id = ?`,
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                message: 'Property not found'
            });
        }

        const [images] = await db.query(
            `SELECT id, image_url, created_at
             FROM property_images
             WHERE property_id = ?
             ORDER BY id`,
            [propertyId]
        );

        return res.status(200).json({
            message: 'Property retrieved successfully',
            property: {
                ...properties[0],
                images
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get property'
        });
    }
};

// ADD PROPERTY
exports.addProperty = async (req, res) => {
    try {
        const {
            location_id,
            title,
            description,
            property_type,
            bedrooms,
            bathrooms,
            monthly_rent
        } = req.body;

        if (!location_id || !title || monthly_rent === undefined) {
            return res.status(400).json({
                message: 'location_id, title and monthly_rent are required'
            });
        }

        if (
            req.user?.accountType !== 'user' ||
            req.user?.role !== 'landlord'
        ) {
            return res.status(403).json({
                message: 'Only landlords can add properties'
            });
        }

        const locationId = Number(location_id);
        const rent = Number(monthly_rent);

        if (!Number.isInteger(locationId) || locationId <= 0) {
            return res.status(400).json({
                message: 'Invalid location ID'
            });
        }

        if (!Number.isFinite(rent) || rent < 0) {
            return res.status(400).json({
                message: 'Invalid monthly rent'
            });
        }

        const [locations] = await db.query(
            'SELECT id FROM location WHERE id = ?',
            [locationId]
        );

        if (locations.length === 0) {
            return res.status(404).json({
                message: 'Location not found'
            });
        }

        const [result] = await db.query(
            `INSERT INTO properties
             (landlord_id, location_id, title, description, property_type,
              bedrooms, bathrooms, monthly_rent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.id,
                locationId,
                title,
                description || null,
                property_type || 'House',
                bedrooms ?? 0,
                bathrooms ?? 0,
                rent
            ]
        );

        return res.status(201).json({
            message: 'Property added successfully',
            propertyId: result.insertId
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not add property'
        });
    }
};

// UPDATE PROPERTY
exports.updateProperty = async (req, res) => {
    try {
        const propertyId = Number(req.params.id);

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({
                message: 'Invalid property ID'
            });
        }

        const [properties] = await db.query(
            'SELECT landlord_id FROM properties WHERE id = ?',
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                message: 'Property not found'
            });
        }

        const owner =
            req.user?.accountType === 'user' &&
            Number(req.user.id) === Number(properties[0].landlord_id);

        if (!owner && req.user?.accountType !== 'admin') {
            return res.status(403).json({
                message: 'Not allowed to update this property'
            });
        }

        const allowedFields = [
            'location_id',
            'title',
            'description',
            'property_type',
            'bedrooms',
            'bathrooms',
            'monthly_rent',
            'status'
        ];

        const updates = [];
        const values = [];

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates.push(`${field} = ?`);
                values.push(req.body[field]);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                message: 'No valid fields provided for update'
            });
        }

        if (req.body.location_id !== undefined) {
            const locationId = Number(req.body.location_id);

            if (!Number.isInteger(locationId) || locationId <= 0) {
                return res.status(400).json({
                    message: 'Invalid location ID'
                });
            }

            const [locations] = await db.query(
                'SELECT id FROM location WHERE id = ?',
                [locationId]
            );

            if (locations.length === 0) {
                return res.status(404).json({
                    message: 'Location not found'
                });
            }
        }

        if (
            req.body.status !== undefined &&
            !['available', 'rented', 'unavailable'].includes(req.body.status)
        ) {
            return res.status(400).json({
                message: 'Invalid property status'
            });
        }

        if (req.body.monthly_rent !== undefined) {
            const rent = Number(req.body.monthly_rent);

            if (!Number.isFinite(rent) || rent < 0) {
                return res.status(400).json({
                    message: 'Invalid monthly rent'
                });
            }

            values[updates.indexOf('monthly_rent = ?')] = rent;
        }

        values.push(propertyId);

        await db.query(
            `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return res.status(200).json({
            message: 'Property updated successfully'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not update property'
        });
    }
};

// DELETE PROPERTY
exports.deleteProperty = async (req, res) => {
    try {
        const propertyId = Number(req.params.id);

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({
                message: 'Invalid property ID'
            });
        }

        const [properties] = await db.query(
            'SELECT landlord_id FROM properties WHERE id = ?',
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                message: 'Property not found'
            });
        }

        const owner =
            req.user?.accountType === 'user' &&
            Number(req.user.id) === Number(properties[0].landlord_id);

        if (!owner && req.user?.accountType !== 'admin') {
            return res.status(403).json({
                message: 'Not allowed to delete this property'
            });
        }

        await db.query(
            'DELETE FROM properties WHERE id = ?',
            [propertyId]
        );

        return res.status(200).json({
            message: 'Property deleted successfully'
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not delete property. It may have related records.'
        });
    }
};

// ADD PROPERTY IMAGE
exports.addPropertyImage = async (req, res) => {
    try {
        const propertyId = Number(req.params.id);
        const { image_url } = req.body;

        if (!Number.isInteger(propertyId) || propertyId <= 0) {
            return res.status(400).json({
                message: 'Invalid property ID'
            });
        }

        if (!image_url) {
            return res.status(400).json({
                message: 'image_url is required'
            });
        }

        const [properties] = await db.query(
            'SELECT landlord_id FROM properties WHERE id = ?',
            [propertyId]
        );

        if (properties.length === 0) {
            return res.status(404).json({
                message: 'Property not found'
            });
        }

        const owner =
            req.user?.accountType === 'user' &&
            Number(req.user.id) === Number(properties[0].landlord_id);

        if (!owner && req.user?.accountType !== 'admin') {
            return res.status(403).json({
                message: 'Not allowed to add images to this property'
            });
        }

        const [result] = await db.query(
            `INSERT INTO property_images (property_id, image_url)
             VALUES (?, ?)`,
            [propertyId, image_url]
        );

        return res.status(201).json({
            message: 'Image added successfully',
            imageId: result.insertId
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not add property image'
        });
    }
};
