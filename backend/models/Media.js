const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const MediaSchema = new Schema({
    device: {type: Schema.Types.ObjectId, ref: 'Device'},
    filename: String,
    mime: String,
    createdAt: {type: Date, default: Date.now},
    path: String
});
module.exports = mongoose.model('Media', MediaSchema);
