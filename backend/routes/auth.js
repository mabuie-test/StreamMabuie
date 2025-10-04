const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/register', async (req,res)=>{
    try {
      const {email, password} = req.body;
      if(!email || !password) return res.status(400).send('missing');
      const existing = await User.findOne({email});
      if(existing) return res.status(400).send('exists');
      const hash = await bcrypt.hash(password, 10);
      const u = new User({email, passwordHash: hash});
      await u.save();
      res.json({ok:true});
    } catch(e){ res.status(500).send('err'); }
});

router.post('/login', async (req,res)=>{
    try {
      const {email, password} = req.body;
      const u = await User.findOne({email});
      if(!u) return res.status(401).send('no user');
      const ok = await bcrypt.compare(password, u.passwordHash);
      if(!ok) return res.status(401).send('bad');
      const token = jwt.sign({id: u._id}, process.env.JWT_SECRET || 'devsecret', {expiresIn:'30d'});
      res.json({token});
    } catch(e){ res.status(500).send('err'); }
});

module.exports = router;
