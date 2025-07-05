require('dotenv').config(); // ✅ buscará automáticamente en la raíz del proyecto

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
    console.log('Conectado a bd con Carrito');
  } catch (err) {
    console.error('Error al conectar a MariaDB:', err.message);
    console.log('Usuario:', process.env.DB_USER);
    console.log('Contraseña:', process.env.DB_PASSWORD ? '[OK]' : '[VACÍA]');
  }
})();

async function isConnected() {
  try {
    await db.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('DB connection failed:', error.message);
    return false;
  }
}

// === Funciones del carrito ===

async function getCarrito(usuario_id) {
  const [rows] = await db.query(
    'SELECT c.*, p.nombre_maquina, p.precio FROM carrito c JOIN productos p ON c.producto_id = p.id WHERE c.usuario_id = ?',
    [usuario_id]
  );
  return rows;
}

async function agregarAlCarrito(usuario_id, producto_id, cantidad = 1) {
  await db.query(
    `INSERT INTO carrito (usuario_id, producto_id, cantidad)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE cantidad = cantidad + ?`,
    [usuario_id, producto_id, cantidad, cantidad]
  );
}

async function actualizarCantidadCarrito(usuario_id, producto_id, cantidad) {
  await db.query(
    'UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?',
    [cantidad, usuario_id, producto_id]
  );
}

async function eliminarDelCarrito(usuario_id, producto_id) {
  await db.query(
    'DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?',
    [usuario_id, producto_id]
  );
}

async function vaciarCarrito(usuario_id) {
  await db.query('DELETE FROM carrito WHERE usuario_id = ?', [usuario_id]);
}

module.exports = {
  isConnected,
  getCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito
};
