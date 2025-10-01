const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('../utils/jwt');

const SALT_ROUNDS = 10;

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'missing' });
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: 'user exists' });
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const u = new User({ username, passwordHash: hash, role: 'admin' });
    await u.save();
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const u = await User.findOne({ username });
    if (!u) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    const token = jwt.sign({ userId: u._id, username: u.username, role: u.role });
    return res.json({ token });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}; 
