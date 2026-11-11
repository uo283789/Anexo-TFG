
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Falta configurar JWT_SECRET en el archivo .env');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fsleep',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


/* =========================
   LINK AUTENTICACION
========================= */
app.get('/auth', (req, res) => {
  const { redirect_uri, state } = req.query;

  // Comprobar que los parámetros existen y son cadenas.
  if (
    typeof redirect_uri !== 'string' ||
    typeof state !== 'string' ||
    !state.trim()
  ) {
    return res.status(400).send('Solicitud de vinculación no válida.');
  }

  // Validar la dirección de retorno de Alexa.
  let urlRetorno;

  try {
    urlRetorno = new URL(redirect_uri);
  } catch {
    return res.status(400).send('Dirección de retorno no válida.');
  }

  const dominiosPermitidos = [
    'amazon.com',
    'amazon.co.uk',
    'amazon.de',
    'amazon.co.jp',
    'amazon.ca',
    'amazon.com.au'
  ];

  const dominioValido = dominiosPermitidos.some(dominio =>
    urlRetorno.hostname === dominio ||
    urlRetorno.hostname.endsWith('.' + dominio)
  );

  if (urlRetorno.protocol !== 'https:' || !dominioValido) {
    return res.status(400).send('Dirección de retorno no válida.');
  }

  // Escapar valores antes de introducirlos en el HTML.
  const escaparHTML = valor => String(valor).replace(/[&<>"']/g, caracter => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caracter]);

  const redirectSeguro = escaparHTML(redirect_uri);
  const stateSeguro = escaparHTML(state);

  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>fsleep</title>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
}

body {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background:
        linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)),
        url('https://wallpapers.com/images/featured/noche-estrellada-luna-bdlgkile5f7jt8bl.jpg');
    background-size: cover;
    background-position: center;
}

.container {
    width: 90%;
    max-width: 900px;
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    justify-content: center;
}

.card {
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(12px);
    border-radius: 20px;
    padding: 30px;
    width: 380px;
    color: white;
    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.logo {
    text-align: center;
    margin-bottom: 25px;
}

.logo h1 {
    color: #4fd8ff;
    font-size: 42px;
    font-style: italic;
}

.logo p {
    color: #ddd;
    margin-top: 5px;
}

h2 {
    margin-bottom: 20px;
    text-align: center;
}

input {
    width: 100%;
    padding: 12px;
    margin-bottom: 12px;
    border: none;
    border-radius: 10px;
    font-size: 15px;
}

button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 10px;
    background: #25c9ff;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: .3s;
}

button:hover {
    background: #00b8f0;
}
</style>
</head>

<body>
<div class="container">

    <div class="card">
        <div class="logo">
            <h1>fsleep</h1>
            <p>Seguimiento inteligente del sueño</p>
        </div>

        <h2>Iniciar sesión</h2>

        <form method="POST" action="/login-alexa">
            <input type="hidden" name="redirect_uri" value="${redirectSeguro}">
            <input type="hidden" name="state" value="${stateSeguro}">

            <input name="email" type="email"
                   placeholder="Correo electrónico" required>
            <input name="password" type="password"
                   placeholder="Contraseña" required>

            <button type="submit">Iniciar sesión</button>
        </form>
    </div>

    <div class="card">
        <h2>Crear cuenta</h2>

        <form method="POST" action="/register-alexa">
            <input type="hidden" name="redirect_uri" value="${redirectSeguro}">
            <input type="hidden" name="state" value="${stateSeguro}">

            <input name="nombre" placeholder="Nombre" required>
            <input name="email" type="email"
                   placeholder="Correo electrónico" required>
            <input name="password" type="password"
                   placeholder="Contraseña" required>

            <button type="submit">Registrarse</button>
        </form>
    </div>

</div>
</body>
</html>
`);
});

/* =========================
   REGISTRO DE USUARIO
========================= */
app.post('/register-alexa', async (req, res) => {

  // Escapar texto para evitar que los mensajes de error interpreten HTML
  const escaparHTML = (texto = '') => {
    return String(texto).replace(/[&<>"']/g, caracter => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[caracter]);
  };

  // Mostrar error y permitir volver al formulario
  const mostrarError = (mensaje) => {
    const redirect = req.body.redirect_uri || '';
    const state = req.body.state || '';

    const parametros = new URLSearchParams({
      redirect_uri: redirect,
      state: state
    });

    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error de registro - fsleep</title>
      </head>
      <body>
        <h3>Error en el registro</h3>
        <p>${escaparHTML(mensaje)}</p>
        <a href="/auth?${escaparHTML(parametros.toString())}">
          Volver al formulario
        </a>
      </body>
      </html>
    `);
  };

  try {
    let { nombre, email, password, redirect_uri, state } = req.body;

    // Validar la dirección de retorno de Alexa
    let urlRetorno;

    try {
      urlRetorno = new URL(redirect_uri);
    } catch {
      return mostrarError('La dirección de retorno no es válida.');
    }

    const dominiosPermitidos = [
      'amazon.com',
      'amazon.co.uk',
      'amazon.de',
      'amazon.co.jp',
      'amazon.ca',
      'amazon.com.au'
    ];

    const dominioValido = dominiosPermitidos.some(dominio =>
      urlRetorno.hostname === dominio ||
      urlRetorno.hostname.endsWith('.' + dominio)
    );

    if (
      urlRetorno.protocol !== 'https:' ||
      !dominioValido ||
      typeof state !== 'string' ||
      !state.trim()
    ) {
      return mostrarError('La solicitud de vinculación con Alexa no es válida.');
    }

    // Normalizar nombre y correo
    nombre = typeof nombre === 'string' ? nombre.trim() : '';

    email = typeof email === 'string'
      ? email.toLowerCase().trim()
      : '';

    // Comprobar que se han rellenado todos los campos
    if (
      !nombre ||
      !email ||
      typeof password !== 'string' ||
      password.length === 0
    ) {
      return mostrarError('Debes rellenar todos los campos.');
    }

    // Validar nombre
    if (nombre.length > 100) {
      return mostrarError(
        'El nombre no puede superar los 100 caracteres.'
      );
    }

    // Validar formato del correo electrónico
    const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email.length > 254 || !formatoEmail.test(email)) {
      return mostrarError(
        'Introduce una dirección de correo electrónico válida.'
      );
    }

    // Validar contraseña.
    // No eliminar sus espacios: forman parte de la contraseña.
    if (
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return mostrarError(
        'La contraseña debe tener al menos 8 caracteres y no superar los 72 bytes.'
      );
    }

    // Comprobar si el correo o el nombre ya están registrados
    const [existentes] = await pool.execute(
      `SELECT id, nombre, email
       FROM usuarios
       WHERE email = ? OR nombre = ?`,
      [email, nombre]
    );

    // Comprobar correo duplicado
    if (existentes.some(usuario => usuario.email.toLowerCase() === email)) {
      return mostrarError(
        'Ya existe una cuenta con ese correo electrónico.'
      );
    }

    // Comprobar nombre duplicado
    if (existentes.some(usuario => usuario.nombre === nombre)) {
      return mostrarError(
        'Ese nombre de usuario ya está registrado.'
      );
    }

    // Encriptar la contraseña antes de guardarla
    const passwordHash = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en MySQL
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, email, password_hash)
       VALUES (?, ?, ?)`,
      [nombre, email, passwordHash]
    );

    // Login automático tras el registro.
    // Se mantiene el mecanismo actual para no romper /token.
    // IMPORTANTE: sustituir por un código OAuth temporal y de un solo uso.
    const code = result.insertId;

    // Redirigir a Alexa conservando los parámetros de la solicitud
    urlRetorno.searchParams.set('code', String(code));
    urlRetorno.searchParams.set('state', state);

    return res.redirect(urlRetorno.toString());

  } catch (error) {
    console.error('Error durante el registro:', error);

    // Gestionar duplicados detectados por restricciones de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      return mostrarError(
        'El correo o el nombre de usuario ya están registrados.'
      );
    }

    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Error de registro - fsleep</title>
      </head>
      <body>
        <h3>No se ha podido completar el registro</h3>
        <p>Se ha producido un error. Inténtalo de nuevo más tarde.</p>
        <a href="/auth">Volver al formulario</a>
      </body>
      </html>
    `);
  }
});


/* =========================
   LOGIN ALEXA
========================= */
app.post('/login-alexa', async (req, res) => {

  console.log("========== LOGIN ==========");
  console.log("Body:", req.body);
  console.log("email:", req.body.email);
  console.log("redirect_uri:", req.body.redirect_uri);
  console.log("state:", req.body.state);
  console.log("===========================");

  try {

    let { email, password, redirect_uri, state } = req.body;

  
    if (!redirect_uri || !redirect_uri.includes('amazon.com')) {
      return res.send("<h3>Error</h3><p>Redirect URI no válida</p>");
    }

    
    if (email) {
      email = email
        .toLowerCase()
        .replace(/ arroba /g, '@')
        .replace(/ punto /g, '.')
        .replace(/\s+/g, '');
    }

    
    if (password) {
      password = password.replace(/\s+/g, '');
    }

    const [rows] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    // Usuario no encontrado
    if (rows.length === 0) {
      return res.send(`
        <h3>Error</h3>
        <p>Usuario no encontrado</p>
        <a href="/auth?redirect_uri=${redirect_uri}&state=${state}">
          Volver
        </a>
      `);
    }

    const usuario = rows[0];

    const ok = await bcrypt.compare(password, usuario.password_hash);

    // Password incorrecta
    if (!ok) {
      return res.send(`
        <h3>Error</h3>
        <p>Contraseña incorrecta</p>
        <a href="/auth?redirect_uri=${redirect_uri}&state=${state}">
          Volver
        </a>
      `);
    }

    
    const code = usuario.id;

    // Redirección a Alexa
    return res.redirect(`${redirect_uri}?code=${code}&state=${state}`);

  } catch (error) {

    console.error(error);

    return res.send(`
      <h3>Error</h3>
      <p>Error en login</p>
      <a href="/auth?redirect_uri=${req.body.redirect_uri}&state=${req.body.state}">
        Volver
      </a>
    `);
  }
});


/* =========================
   LOGIN ANDROID
========================= */
app.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        ok: false,
        error: 'Faltan datos'
      });
    }

    email = email.toLowerCase().trim();

    const [rows] = await pool.execute(
      `SELECT id, nombre, email, password_hash
       FROM usuarios
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    const usuario = rows[0];

    const ok = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!ok) {
      return res.status(401).json({
        ok: false,
        error: 'Usuario o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      ok: true,
      token
    });

  } catch (error) {
    console.error('Error en login Android:', error.code || error.name);

    return res.status(500).json({
      ok: false,
      error: 'Error en login'
    });
  }
});


/* =========================
   OBTENER TOKEN (ALEXA)
========================= */
app.post('/token', async (req, res) => {
  try {
    const { grant_type, code } = req.body;

    // Validar tipo de grant
    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type'
      });
    }

    // Validar code
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({
        error: 'invalid_request'
      });
    }

    // Buscar usuario por el code (id)
    const [rows] = await pool.execute(
      'SELECT id, email FROM usuarios WHERE id = ? LIMIT 1',
      [code.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        error: 'invalid_grant'
      });
    }

    const usuario = rows[0];

    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Respuesta estándar OAuth
    return res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 604800
    });

  } catch (error) {
    console.error('Error en /token:', error.code || error.name);

    return res.status(500).json({
      error: 'server_error'
    });
  }
});




/* =========================
   MIDDLEWARE TOKEN
========================= */
function verificarToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token requerido o formato inválido'
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        error: 'Token requerido'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.usuario = decoded;

    return next();

  } catch (error) {
    console.error('Error al verificar JWT:', error.name);

    return res.status(401).json({
      error: 'Token inválido o caducado'
    });
  }
}





/* =========================
   GUARDAR SESIÓN DE SUEÑO
========================= */
app.post('/sleep', verificarToken, async (req, res) => {
  console.log('Body recibido:', req.body);

  try {
    const {
      sleep_start,
      sleep_end,
      sleep_duration,
      sleep_quality
    } = req.body;

    await pool.execute(
      `INSERT INTO sleep_sessions
      (sleep_start, sleep_end, sleep_duration, sleep_quality, usuario_id)
      VALUES (?, ?, ?, ?, ?)`,
      [
        sleep_start,
        sleep_end,
        sleep_duration,
        sleep_quality,
        req.usuario.id
      ]
    );

    res.json({
      ok: true
    });

  } catch (error) {

  console.error("ERROR MYSQL COMPLETO:");
  console.error(error);

  res.status(500).json({
    error: error.message
  });

}
});



/* =========================
   IMPORTAR SUEÑO DE APLICACION ANDROID
========================= */
app.get('/fitness/sleep', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
          date,
          deep_sleep,
          light_sleep,
          rem_sleep,
          awake_time,
          heart_rate_avg
       FROM wearable_sleep_data
       WHERE usuario_id = ?
       ORDER BY date DESC
       LIMIT 1`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'No hay datos de sueño importados'
      });
    }

    const sleep = rows[0];

    const duration =
      (sleep.deep_sleep || 0) +
      (sleep.light_sleep || 0) +
      (sleep.rem_sleep || 0);

    const hasStages =
      (sleep.deep_sleep || 0) > 0 ||
      (sleep.light_sleep || 0) > 0 ||
      (sleep.rem_sleep || 0) > 0 ||
      (sleep.awake_time || 0) > 0;

    res.json({
      ok: true,
      date: sleep.date,
      duration,
      heartRate: sleep.heart_rate_avg || 0,
      deep: sleep.deep_sleep || 0,
      light: sleep.light_sleep || 0,
      rem: sleep.rem_sleep || 0,
      awake: sleep.awake_time || 0,
      hasStages
    });

  } catch (error) {
    console.error('Error obteniendo sueño:', error);

    res.status(500).json({
      ok: false,
      error: 'Error al obtener los datos de sueño'
    });
  }
});


/* =========================
   GUARDAR DATOS DE SUEÑO DE APLICACION ANDROID
========================= */
app.post('/wearable/upload', verificarToken, async (req, res) => {
  try {
    const {
      date,
      deep_sleep,
      light_sleep,
      rem_sleep,
      awake_time,
      heart_rate_avg
    } = req.body;

    const usuarioId = req.usuario.id;

    const [existente] = await pool.execute(
      `SELECT id
       FROM wearable_sleep_data
       WHERE usuario_id = ?
       AND date = ?`,
      [usuarioId, date]
    );

    if (existente.length > 0) {

      await pool.execute(
        `UPDATE wearable_sleep_data
         SET deep_sleep = ?,
             light_sleep = ?,
             rem_sleep = ?,
             awake_time = ?,
             heart_rate_avg = ?
         WHERE usuario_id = ?
         AND date = ?`,
        [
          deep_sleep,
          light_sleep,
          rem_sleep,
          awake_time,
          heart_rate_avg,
          usuarioId,
          date
        ]
      );

      return res.json({
        ok: true,
        action: 'updated'
      });
    }

    await pool.execute(
      `INSERT INTO wearable_sleep_data
      (date, deep_sleep, light_sleep, rem_sleep, awake_time, heart_rate_avg, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        deep_sleep,
        light_sleep,
        rem_sleep,
        awake_time,
        heart_rate_avg,
        usuarioId
      ]
    );

    res.json({
      ok: true,
      action: 'inserted'
    });

  } catch (error) {
    console.error('Error guardando datos wearables:', error);

    res.status(500).json({
      ok: false,
      error: error.message
    });
  }
});



/* =========================
   OBTENER LAS ÚLTIMAS 7 SESIONES DE SUEÑO DEL USUARIO
========================= */
app.get('/sleep/weekly', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sleep_start, sleep_duration, sleep_quality
       FROM sleep_sessions
       WHERE usuario_id = ?
       ORDER BY sleep_start DESC
       LIMIT 7`,
      [req.usuario.id]
    );

    return res.json(rows);

  } catch (error) {
    console.error(
      'Error obteniendo datos semanales:',
      error.code || error.name
    );

    return res.status(500).json({
      error: 'Error obteniendo datos semanales'
    });
  }
});



/* =========================
   OBTENER LA ÚLTIMA CALIDAD DE SUEÑO DEL USUARIO
========================= */
app.get('/sleep/last', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sleep_quality
       FROM sleep_sessions
       WHERE usuario_id = ?
       ORDER BY sleep_end DESC
       LIMIT 1`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.json({});
    }

    return res.json(rows[0]);

  } catch (error) {
    console.error(
      'Error obteniendo la última calidad de sueño:',
      error.code || error.name
    );

    return res.status(500).json({
      error: 'Error al obtener la última calidad de sueño'
    });
  }
});



/* =========================
   OBTENER RESUMEN DEL ÚLTIMO SUEÑO PARA EL WIDGET
========================= */
app.get('/widget/latest-sleep', verificarToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT sleep_duration, sleep_quality
       FROM sleep_sessions
       WHERE usuario_id = ?
       ORDER BY sleep_start DESC
       LIMIT 1`,
      [req.usuario.id]
    );

    if (rows.length === 0) {
      return res.json(null);
    }

    const sleep = rows[0];

    const duration = Number(sleep.sleep_duration);

    if (!Number.isFinite(duration) || duration < 0) {
      return res.status(500).json({
        error: 'La duración del sueño almacenada no es válida'
      });
    }

    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    let stars = '';

    switch (sleep.sleep_quality) {
      case 'Excelente':
        stars = '⭐⭐⭐⭐⭐';
        break;
      case 'Buena':
        stars = '⭐⭐⭐⭐';
        break;
      case 'Aceptable':
        stars = '⭐⭐⭐';
        break;
      case 'Mala':
        stars = '⭐⭐';
        break;
      default:
        stars = '⭐';
    }

    return res.json({
      duration: `${hours} h ${minutes} min`,
      quality: sleep.sleep_quality,
      stars
    });

  } catch (error) {
    console.error(
      'Error obteniendo el resumen del último sueño:',
      error.code || error.name
    );

    return res.status(500).json({
      error: 'Error al obtener el resumen del sueño'
    });
  }
});

app.listen(3000, () => {
  console.log('API escuchando en puerto 3000');
});
