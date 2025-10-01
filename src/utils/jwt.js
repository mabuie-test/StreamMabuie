const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev_secret';

exports.sign = (payload, opts = {}) => jwt.sign(payload, SECRET, Object.assign({ expiresIn: '7d' }, opts));
exports.verify = (token) => jwt.verify(token, SECRET);
