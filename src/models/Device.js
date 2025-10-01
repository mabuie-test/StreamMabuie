const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deviceSchema = new Schema({
  deviceId: { type: String, required: true, unique: true },
  label: { type: String },
  owner: { type: Schema.Types.ObjectId, ref: 'User' },
  lastSeen: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', deviceSchema);
