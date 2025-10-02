const jwtUtils = require('../utils/jwt');

module.exports = function(req,res,next){
  try {
    const h = req.headers['authorization'];
    if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' });
    const token = h.slice(7);
    const payload = jwtUtils.verify(token);
    req.user = payload;
    next();
  } catch(e) { return res.status(401).json({ error: 'invalid token' }); }
};
