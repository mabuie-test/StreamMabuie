// server/src/routes/auth.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

// modelos / utilitários necessários para o fallback form
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// Rota fallback para suportar login via form (ex.: submit hidden form do login.html)
// Recebe urlencoded form { username, password } e responde com HTML que grava token em localStorage.
router.post('/login-web', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const username = (req.body.username || '').toString().trim();
    const password = (req.body.password || '').toString();

    if (!username || !password) {
      return res.status(400).send(`<html><body>Missing fields. <a href="/login.html">Voltar</a></body></html>`);
    }

    const u = await User.findOne({ username });
    if (!u) {
      return res.status(401).send(`<html><body>Credenciais inválidas. <a href="/login.html">Voltar</a></body></html>`);
    }

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) {
      return res.status(401).send(`<html><body>Credenciais inválidas. <a href="/login.html">Voltar</a></body></html>`);
    }

    const token = jwt.sign({ userId: u._id, username: u.username });

    // Responde com uma página que guarda o token no localStorage e redireciona para painel
    res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Entrando...</title></head>
        <body>
          <script>
            try {
              localStorage.setItem('token', ${JSON.stringify(token)});
              location.href = '/panel.html';
            } catch (e) {
              document.body.innerText = 'Login OK mas não foi possível guardar token: ' + e.message + '\\nVoltar para <a href="/login.html">login</a>';
            }
          </script>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('login-web err', err);
    res.status(500).send(`<html><body>Erro no servidor. <a href="/login.html">Voltar</a></body></html>`);
  }
});

module.exports = router;
