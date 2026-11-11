
const customAuthorization = (checkPermission) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: 'Please login first.'
            });
        }

        if (typeof checkPermission !== 'function') {
            return res.status(500).json({
                message: 'Invalid permission function.'
            });
        }

        const allowed = checkPermission(req.user, req);

        if (!allowed) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action.'
            });
        }

        next();
    };
};

module.exports = customAuthorization;
