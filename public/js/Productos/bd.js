require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

let db;

// Crear conexión
(async () => {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    console.log('Conectado exitosamente a MariaDB');
  } catch (err) {
    console.error('Error al conectar a MariaDB:', err.message);
    console.log('Usuario:', process.env.DB_USER);
    console.log('Contraseña:', process.env.DB_PASSWORD ? '[OK]' : '[VACÍA]');
  }
})();

// Función para probar conexión
async function isConnected() {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('DB connection failed:', error.message);
    return false;
  }
}

// Operaciones con computadores

async function getComputadores() {
  const [rows] = await db.query('SELECT * FROM productos');
  return rows;
}

async function getComputadorById(id) {
  const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
  return rows[0] || null;
}

async function insertComputador({ nombre_maquina, estado, precio}) {
  const [result] = await db.query(
    'INSERT INTO productos (nombre_maquina, estado, precio) VALUES (?, ?, ?)',
    [nombre_maquina, estado, precio]
  );
  return result.insertId;
}

async function updateComputador(id, { nombre_maquina, estado, precio}) {
  await db.query(
    'UPDATE productos SET nombre_maquina = ?, estado = ?, precio = ? WHERE id = ?',
    [nombre_maquina, estado, precio, id]
  );
}


async function deleteComputador(id) {
  await db.query('DELETE FROM productos WHERE id = ?', [id]);
}

module.exports = {
  isConnected,
  getComputadores,
  getComputadorById,
  insertComputador,
  updateComputador,
  deleteComputador
};
