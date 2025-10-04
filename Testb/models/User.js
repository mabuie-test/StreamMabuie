const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  name: { type: String }
});

UserSchema.methods.setPassword = async function(password){
  this.passwordHash = await bcrypt.hash(password, 10);
};

UserSchema.methods.validatePassword = function(password){
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
