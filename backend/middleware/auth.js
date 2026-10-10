const User = require('../models/user')
const jwt = require("jsonwebtoken")

exports.isAuthenticatedUser = async (req, res, next) => {
    const authorization = req.header('Authorization');
    if (!authorization) {
        return res.status(401).json({ message: 'Authorization header is required' });
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Authorization header must use the Bearer token format' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = await User.findById(decoded.id);
    if (!req.user) {
        return res.status(401).json({ message: 'The user associated with this token no longer exists' });
    }

    if (req.user.isActive === false) {
        return res.status(403).json({ message: 'Your account is inactive' });
    }

    next();
};

exports.authorizeRoles = (...roles) => {

    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to acccess this resource` })

        }
        next()
    }
}