const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');

exports.register = async (req,res)=>{
  try {
    const { username, password } = req.body;
    if(!username||!password) return res.status(400).json({ error: 'missing' });
    if(await User.findOne({ username })) return res.status(400).json({ error: 'exists' });
    const hash = await bcrypt.hash(password, 10);
    const u = new User({ username, passwordHash: hash });
    await u.save();
    res.json({ ok: true });
  } catch(e){ console.error(e); res.status(500).json({ error: e.message }); }
};

exports.login = async (req,res)=>{
  try {
    const { username, password } = req.body;
    if(!username||!password) return res.status(400).json({ error: 'missing' });
    const u = await User.findOne({ username });
    if(!u) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if(!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ userId: u._id, username: u.username });
    res.json({ token, username: u.username });
  } catch(e){ console.error(e); res.status(500).json({ error: e.message }); }
};
