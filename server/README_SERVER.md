StealthCam backend - Improved package
------------------------------------

Improvements in this version:
- bcryptjs used (no native compilation)
- express-rate-limit added for brute-force/rate limiting
- better JWT handling and consistent payload (userId)
- safer frame upload handling and size limits
- graceful shutdown and logging (morgan)
- public/ frontend included (viewer + panel)
- instructions for Render (no docker) included

Quick start:
1. Copy .env.example -> .env and edit values
2. cd server && npm install
3. npm start

Endpoints:
- POST /api/auth/register {username,password}
- POST /api/auth/login {username,password} -> { token }
- POST /api/frame/:deviceId (raw image/jpeg) [Authorization: Bearer <token>] (camera via HTTP)
- WS at /ws?deviceId=ID&token=JWT  (camera) or /ws?viewerFor=ID (viewer)
- GET /stream/:deviceId -> MJPEG
- GET /api/devices (requires Authorization Bearer <token>) -> devices for user

Notes for Render:
- Render provides PORT via env. Use that value.
- Keep MAX_FRAME_MB small (2-5) to prevent large uploads.
