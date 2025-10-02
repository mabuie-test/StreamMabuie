const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'dev_secret';

exports.sign = (payload, opts={}) => {
  // ensure small payload
  const p = Object.assign({}, payload);
  return jwt.sign(p, SECRET, Object.assign({ expiresIn: '7d' }, opts));
};
exports.verify = (token) => jwt.verify(token, SECRET);
