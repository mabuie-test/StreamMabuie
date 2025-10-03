const jwtUtils = require('../utils/jwt');
module.exports = (req,res,next)=>{
  try {
    const h = req.headers['authorization'];
    if(!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'no token' });
    const token = h.slice(7);
    const p = jwtUtils.verify(token);
    req.user = p;
    next();
  } catch(e){ return res.status(401).json({ error: 'invalid' }); }
};
