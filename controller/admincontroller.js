
const db = require('../db/db.js');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generatetoken');


// ADD ADMIN
// Only an authenticated administrator should access this function.
const Addadmin = async (req, res) => {
    try {
        const { username, Akey, password, department } = req.body;

        if (!username || !Akey || !password) {
            return res.status(400).json({
                message: 'Username, admin key and password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters'
            });
        }

        // Check duplicate username or admin key
        const [existing] = await db.query(
            `SELECT id FROM admin
             WHERE usern = ? OR Akey = ?`,
            [username, Akey]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Admin username or key already exists'
            });
        }

        // Hash admin password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO admin
            (usern, Akey, pass, role, department)
            VALUES (?, ?, ?, ?, ?)`,
            [
                username,
                Akey,
                hashedPassword,
                'admin',
                department || 'General'
            ]
        );

        return res.status(201).json({
            message: 'Admin created successfully'
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not create admin'
        });
    }
};


// ADMIN LOGIN
const Loginadmin = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        const [admins] = await db.query(
            'SELECT * FROM admin WHERE usern = ?',
            [username]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const admin = admins[0];

        // Compare password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            admin.pass
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        // Generate admin JWT
        const token = generateToken(
            admin.id,
            'admin',
            'admin'
        );

        return res.status(200).json({
            message: 'Login successful',
            token: token
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Admin login failed'
        });
    }
};


// GET MY ADMIN PROFILE
const Getmyadmin = async (req, res) => {
    try {
        const [admins] = await db.query(
            `SELECT id, usern, role, department
             FROM admin
             WHERE id = ?`,
            [req.user.id]
        );

        if (admins.length === 0) {
            return res.status(404).json({
                message: 'Admin not found'
            });
        }

        return res.status(200).json({
            message: 'Admin profile retrieved successfully',
            admin: admins[0]
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not retrieve admin profile'
        });
    }
};


// GET ALL ADMINS
const Getalladmins = async (req, res) => {
    try {
        const [admins] = await db.query(
            `SELECT id, usern, role, department
             FROM admin`
        );

        return res.status(200).json({
            message: 'Admins retrieved successfully',
            admins
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not retrieve admins'
        });
    }
};


// GET ONE ADMIN
const Get1admin = async (req, res) => {
    try {
        const adminId = Number(req.params.id);

        if (!Number.isInteger(adminId) || adminId <= 0) {
            return res.status(400).json({
                message: 'Invalid admin ID'
            });
        }

        const [admins] = await db.query(
            `SELECT id, usern, role, department
             FROM admin
             WHERE id = ?`,
            [adminId]
        );

        if (admins.length === 0) {
            return res.status(404).json({
                message: 'Admin not found'
            });
        }

        return res.status(200).json({
            message: 'Admin retrieved successfully',
            admin: admins[0]
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not retrieve admin'
        });
    }
};


// DELETE ADMIN
const Deleteadmin = async (req, res) => {
    try {
        const adminId = Number(req.params.id);

        if (!Number.isInteger(adminId) || adminId <= 0) {
            return res.status(400).json({
                message: 'Invalid admin ID'
            });
        }

        // Prevent administrator from deleting their own account
        if (adminId === Number(req.user.id)) {
            return res.status(400).json({
                message: 'You cannot delete your own admin account'
            });
        }

        const [result] = await db.query(
            'DELETE FROM admin WHERE id = ?',
            [adminId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Admin not found'
            });
        }

        return res.status(200).json({
            message: 'Admin deleted successfully'
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            message: 'Could not delete admin'
        });
    }
};


module.exports = {
    Addadmin,
    Loginadmin,
    Getmyadmin,
    Getalladmins,
    Get1admin,
    Deleteadmin
};
