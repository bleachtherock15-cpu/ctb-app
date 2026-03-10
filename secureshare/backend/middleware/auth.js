const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'ACCESS_DENIED: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ctb_fallback_secret_change_me');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'ACCESS_DENIED: Invalid or expired token' });
  }
};
