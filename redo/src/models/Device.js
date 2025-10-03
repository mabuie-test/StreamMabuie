
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  deviceId:{type:String,required:true,unique:true},
  label:{type:String,default:''},
  owner:{type:mongoose.Schema.Types.ObjectId, ref:'User', default:null},
  lastSeen:{type:Date, default: Date.now}
},{timestamps:true});
module.exports = mongoose.model('Device', schema);
