const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const deviceSchema = new Schema({
  deviceId: { type: String, required: true, unique: true },
  label: { type: String, default: '' },
  owner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });
module.exports = mongoose.model('Device', deviceSchema);
