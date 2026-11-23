
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured');

            return res.status(500).json({
                message: 'Authentication configuration error'
            });
        }

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Access denied. Please login first.'
            });
        }

        const actualToken = authHeader.split(' ')[1];

        if (!actualToken) {
            return res.status(401).json({
                message: 'Token is required'
            });
        }

        const decoded = jwt.verify(
            actualToken,
            process.env.JWT_SECRET
        );

        if (!decoded.id || !decoded.role || !decoded.accountType) {
            return res.status(401).json({
                message: 'Invalid token information'
            });
        }

        req.user = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;
