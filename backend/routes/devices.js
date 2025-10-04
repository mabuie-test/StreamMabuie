const express = require('express');
const router = express.Router();
const Device = require('../models/Device');

router.post('/register', async (req,res)=>{
    const {uuid, name} = req.body;
    if(!uuid) return res.status(400).send('missing uuid');
    let d = await Device.findOne({uuid});
    if(!d) d = new Device({uuid, name});
    d.lastSeen = new Date();
    await d.save();
    res.json({deviceId: d._id, uuid: d.uuid, name: d.name});
});

router.get('/list', async (req,res)=>{
    const devices = await Device.find().sort({lastSeen:-1}).limit(100);
    res.json(devices);
});

module.exports = router;
