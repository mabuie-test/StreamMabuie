const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, unique: true, required: true },
  name: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  key: { type: String }, // device secret key
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);
