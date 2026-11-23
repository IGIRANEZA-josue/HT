
const accountTypeMiddleware = (...allowedTypes) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: 'Please login first.'
            });
        }

        if (!allowedTypes.includes(req.user.accountType)) {
            return res.status(403).json({
                message: 'You are not allowed to access this resource.'
            });
        }

        next();
    };
};

module.exports = accountTypeMiddleware;
