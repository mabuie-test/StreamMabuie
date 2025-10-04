const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const DeviceSchema = new Schema({
    uuid: { type: String, index: true },
    name: String,
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    lastSeen: Date
});
module.exports = mongoose.model('Device', DeviceSchema);
