const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Media = require('../models/Media');

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, 'uploads/');
    },
    filename: function(req,file,cb){
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({storage});
const fs = require('fs');
if(!fs.existsSync('uploads')) fs.mkdirSync('uploads');

router.post('/video', upload.single('file'), async (req,res)=>{
    if(!req.file) return res.status(400).send('no file');
    const devUuid = req.body.uuid || null;
    const media = new Media({
        filename: req.file.filename,
        mime: req.file.mimetype,
        path: req.file.path
    });
    await media.save();
    res.json({ok:true, id: media._id, filename: media.filename});
});

router.get('/list', async (req,res)=>{
    const list = await Media.find().sort({createdAt:-1}).limit(200);
    res.json(list);
});

router.get('/file/:filename', async (req,res)=>{
    const fname = req.params.filename;
    const p = path.join(__dirname, '..', 'uploads', fname);
    res.sendFile(p);
});

module.exports = router;
