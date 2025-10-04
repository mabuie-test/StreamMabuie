const jwt = require('jsonwebtoken');
const User = require('../models/User');

const secret = process.env.JWT_SECRET || 'secret';

module.exports = {
  authMiddleware: async (req, res, next) => {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = h.split(' ')[1];
    try {
      const payload = jwt.verify(token, secret);
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },
  signToken: (user) => {
    const payload = { id: user._id, email: user.email };
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }
};
