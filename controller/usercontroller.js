
const db = require('../db/db.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// REGISTER USER
const Adduser = async (req, res) => {
    try {
        const { name, username, email, password, role } = req.body;

        if (!name || !username || !email || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({
                message: 'Invalid email address'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters'
            });
        }

        // Users cannot register as administrators
        const userRole = role || 'seeker';

        if (!['seeker', 'landlord'].includes(userRole)) {
            return res.status(400).json({
                message: 'Role must be seeker or landlord'
            });
        }

        const [existing] = await db.query(
            'SELECT id FROM htracker WHERE usern = ? OR email = ?',
            [username, email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO htracker
            (name, usern, email, pass, role, department)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [name, username, email, hashedPassword, userRole, 'General']
        );

        return res.status(201).json({
            message: 'Registration successful'
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Registration failed'
        });
    }
};


// LOGIN USER
const Loginuser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM htracker WHERE usern = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.pass
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                accountType: 'user'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            message: 'Login successful',
            token: token
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Login failed'
        });
    }
};


// GET MY PROFILE
const Getmyprofile = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, name, usern, email, role, department
             FROM htracker
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'Profile retrieved successfully',
            user: users[0]
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Could not retrieve profile'
        });
    }
};


// UPDATE MY PROFILE
const Updateuser = async (req, res) => {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: 'Name and email are required'
            });
        }

        if (!email.includes('@') || !email.includes('.')) {
            return res.status(400).json({
                message: 'Invalid email address'
            });
        }

        const [existing] = await db.query(
            'SELECT id FROM htracker WHERE email = ? AND id != ?',
            [email, req.user.id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Email already exists'
            });
        }

        await db.query(
            'UPDATE htracker SET name = ?, email = ? WHERE id = ?',
            [name, email, req.user.id]
        );

        return res.status(200).json({
            message: 'Profile updated successfully'
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Could not update profile'
        });
    }
};


// GET ALL USERS (ADMIN ONLY)
const Getallusers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, name, usern, email, role, department
             FROM htracker`
        );

        return res.status(200).json({
            message: 'Users retrieved successfully',
            users: users
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Could not retrieve users'
        });
    }
};


// GET ONE USER (ADMIN ONLY)
const Get1user = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, name, usern, email, role, department
             FROM htracker WHERE id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'User retrieved successfully',
            user: users[0]
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Could not retrieve user'
        });
    }
};


// DELETE MY ACCOUNT
const Deleteuser = async (req, res) => {
    try {
        await db.query(
            'DELETE FROM htracker WHERE id = ?',
            [req.user.id]
        );

        return res.status(200).json({
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: 'Could not delete account'
        });
    }
};


module.exports = {
    Adduser,
    Loginuser,
    Getmyprofile,
    Updateuser,
    Getallusers,
    Get1user,
    Deleteuser
};
