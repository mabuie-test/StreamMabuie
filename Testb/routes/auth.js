const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email exists' });

    const u = new User({ email, name });
    await u.setPassword(password);
    await u.save();
    const token = signToken(u);
    res.json({ token, user: { email: u.email, name: u.name, id: u._id } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await u.validatePassword(password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = signToken(u);
    res.json({ token, user: { email: u.email, name: u.name, id: u._id } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
