// server/src/routes/auth.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');

// models / utils usados pelo fallback form
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('../utils/jwt');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

// /api/auth/login-web : aceita form POST e devolve HTML que grava cookie + localStorage e redireciona
router.post('/login-web', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const username = (req.body.username || '').toString().trim();
    const password = (req.body.password || '').toString();

    if (!username || !password) {
      return res.status(400).send(`<html><body>Missing fields. <a href="/login.html">Back</a></body></html>`);
    }

    const u = await User.findOne({ username });
    if (!u) return res.status(401).send(`<html><body>Invalid credentials. <a href="/login.html">Back</a></body></html>`);

    const ok = await bcrypt.compare(password, u.passwordHash);
    if (!ok) return res.status(401).send(`<html><body>Invalid credentials. <a href="/login.html">Back</a></body></html>`);

    const token = jwt.sign({ userId: u._id, username: u.username });

    // define cookie (not httpOnly so que o script em page possa lê-lo)
    // secure: true -> funciona em https (Render usa https)
    res.cookie('stealth_token', token, { maxAge: 7*24*3600*1000, httpOnly: false, secure: true, sameSite: 'Lax' });

    // devolve página que tenta ler o cookie e salvar no localStorage, depois redireciona.
    // também tem fallback manual (link) para o painel se JS estiver bloqueado.
    res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Entrando...</title></head>
        <body style="font-family: Arial, Helvetica, sans-serif; padding:20px;">
          <div style="max-width:600px;margin:auto;">
            <h3>Entrando...</h3>
            <div id="msg">A processar... Se nada acontecer, clica <a id="link" href="/panel.html"> aqui </a>.</div>
          </div>

          <script>
            (function(){
              try {
                // tenta obter cookie stealth_token
                function getCookie(name) {
                  const match = document.cookie.match(new RegExp('(^|;)\\\\s*' + name + '\\\\s*=\\\\s*([^;]+)'));
                  return match ? decodeURIComponent(match[2]) : null;
                }

                var t = getCookie('stealth_token');
                if (t) {
                  try { localStorage.setItem('token', t); } catch(e) { /* ignore */ }
                  // redireciona para o painel — dá um pequeno delay para o storage persistir
                  setTimeout(function(){ location.href = '/panel.html'; }, 250);
                } else {
                  document.getElementById('msg').innerText = 'Login confirmado, mas não foi possível obter token no cookie. Clica em "aqui" se o redirecionamento não ocorrer.';
                }
              } catch(e) {
                document.getElementById('msg').innerText = 'Erro ao processar login: ' + e.message + '. Clica em "aqui".';
              }
            })();
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
