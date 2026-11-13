const jwt = require('jsonwebtoken');

const generateToken = (id, role, accountType) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is missing');
    }

    return jwt.sign(
        { id, role, accountType },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

module.exports = generateToken;