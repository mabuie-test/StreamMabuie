
module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  maxFrameMb: process.env.MAX_FRAME_MB || 3
};
