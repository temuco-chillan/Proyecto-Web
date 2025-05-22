const mysql = require('mysql2');

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'MBadmin',
  password: 'mbserver2025',
  database: 'Usuarios'
});

db.connect(err => {
  if (err) console.error('Error al conectar a MariaDB:', err.message);
  else console.log('Conectado a MariaDB (bd.js)');
});

async function isConnected() {
  try {
    await pool.query('SELECT 1'); // o una consulta liviana
    return true;
  } catch (error) {
    console.error('DB connection failed:', error.message);
    return false;
  }
}


function getUsers() {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM usuarios', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
}

function createUser({ username, password }) {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO usuarios (username, password) VALUES (?, ?)', [username, password], (err, result) => {
      if (err) reject(err);
      else resolve({ id: result.insertId, username, password });
    });
  });
}

function validateUser({ username, password }) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM usuarios WHERE username = ? AND password = ?', [username, password], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
}

module.exports = {
  isConnected,
  getUsers,
  getUserById,
  createUser,
  validateUser
};