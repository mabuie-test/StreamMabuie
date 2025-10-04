const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const devicesRoutes = require('./routes/devices');
const uploadRoutes = require('./routes/upload');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/upload', uploadRoutes);

// Serve frontend build (frontend/dist) if exists
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const mongoUrl = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';
mongoose.connect(mongoUrl).then(()=> {
    console.log('Mongo connected');
    const port = process.env.PORT || 3000;
    app.listen(port, ()=> console.log('Server running on', port));
}).catch(err => {
    console.error('Mongo connection error', err);
});
