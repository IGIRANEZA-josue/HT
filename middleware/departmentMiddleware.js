
const departmentMiddleware = (...allowedDepartments) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                message: 'Please login first.'
            });
        }

        if (!req.user.department) {
            return res.status(403).json({
                message: 'Department information is missing.'
            });
        }

        if (!allowedDepartments.includes(req.user.department)) {
            return res.status(403).json({
                message: 'You do not have permission for this department.'
            });
        }

        next();
    };
};

module.exports = departmentMiddleware;
