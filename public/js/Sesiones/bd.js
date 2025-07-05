require('dotenv').config();
const mysql = require('mysql2/promise');

let db;

// Crear conexión con async/await
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('Conectado a BD con Sesiones');
  } catch (err) {
    console.error('Error al conectar a MariaDB:', err.message);
  }
})();

// Función de prueba de conexión
async function isConnected() {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('DB connection failed:', error.message);
    return false;
  }
}

// Consultas usando async/await

async function getUsers() {
  const [rows] = await db.query('SELECT * FROM usuarios');
  return rows;
}

async function getUserById(id) {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createUser({ username, password }) {
  const [result] = await db.query(
    'INSERT INTO usuarios (username, password) VALUES (?, ?)',
    [username, password]
  );
  return { id: result.insertId, username, password };
}

async function validateUser({ username, password }) {
  const [rows] = await db.query(
    `SELECT u.id, u.username, u.password, u.rol_id, r.nombre AS rol
     FROM usuarios u
     JOIN roles r ON u.rol_id = r.id
     WHERE u.username = ? AND u.password = ?`,

    [username, password]
  );
  return rows[0] || null;
}

module.exports = {
  isConnected,
  getUsers,
  getUserById,
  createUser,
  validateUser
};
