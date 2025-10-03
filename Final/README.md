StealthCam — Alternative Web System (frontend + backend)
=======================================================

This package contains a redesigned web backend and a styled frontend compatible with the Android app.
It implements:
- POST /api/frame/:deviceId (raw image/jpeg) for HTTP frame uploads
- WS at /ws?deviceId=ID (camera) and /ws?viewerFor=ID (viewer)
- Auth endpoints: /api/auth/register and /api/auth/login (JWT)
- Styled frontend: login, panel, viewer

How to use:
1. Edit server/.env (based on .env.example)
2. cd server && npm install
3. npm start
4. Deploy to Render by pushing repo and setting environment variables (MONGO_URI, JWT_SECRET, PORT).

Download and unzip:
- ZIP: /mnt/data/stealth_web_alternative.zip
