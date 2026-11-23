
const db = require('../db/db.js');

// GET ALL LOCATIONS
exports.getLocations = async (req, res) => {
    try {
        const [locations] = await db.query(
            `SELECT
                id, province, district, sector,
                cell_name, village,
                strreet_address AS street_address
             FROM location
             ORDER BY district, sector`
        );

        return res.status(200).json(locations);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not get locations'
        });
    }
};

// ADD LOCATION
exports.addLocation = async (req, res) => {
    try {
        const {
            province,
            district,
            sector,
            cell_name,
            village,
            street_address
        } = req.body;

        if (
            !province || !district || !sector ||
            !cell_name || !village || !street_address
        ) {
            return res.status(400).json({
                message: 'All location fields are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO location
             (province, district, sector, cell_name, village, strreet_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                province,
                district,
                sector,
                cell_name,
                village,
                street_address
            ]
        );

        return res.status(201).json({
            message: 'Location added successfully',
            locationId: result.insertId
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: 'Could not add location'
        });
    }
};
