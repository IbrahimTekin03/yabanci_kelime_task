const createError = require('http-errors');

const roleMiddleware = (requiredRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles;
    const hasRole = userRoles.some(role => requiredRoles.includes(role));

    if (!hasRole) {
      return next(createError(403, 'Bu işlemi gerçekleştirmek için yetkiniz yok.'));
    }

    next();
  };
};

module.exports = roleMiddleware;