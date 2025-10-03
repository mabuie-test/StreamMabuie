
const jwt = require('jsonwebtoken');
const cfg = require('../config');
exports.sign = (payload, opts={}) => jwt.sign(payload, cfg.jwtSecret, Object.assign({ expiresIn: '7d' }, opts));
exports.verify = (token) => jwt.verify(token, cfg.jwtSecret);
