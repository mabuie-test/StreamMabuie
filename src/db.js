const mongoose = require('mongoose');
module.exports = function connect(uri) {
  return mongoose.connect(uri, { autoIndex: true }).then(()=>console.log('Mongo connected')).catch(e=>{ console.error('Mongo conn err', e); throw e; });
};
