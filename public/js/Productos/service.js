const { Producto } = require('../Models');
const jsonFallback = require('./json');

let useFallback = false;

async function isConnected() {
  try {
    await Producto.sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Base de datos no disponible:', error.message);
    return false;
  }
}

// Obtener todos los productos
async function getProductos() {
  if (useFallback) return jsonFallback.getProducto();
  return await Producto.findAll();
}

// Obtener producto por ID
async function getProductoById(id) {
  if (useFallback) return jsonFallback.getProductoById(id);
  return await Producto.findByPk(id);
}

// Insertar nuevo producto
async function insertProducto(producto) {
  if (useFallback) return jsonFallback.insertProducto(producto);
  const newProd = await Producto.create(producto);
  return newProd.id;
}

// Actualizar producto
async function updateProducto(id, producto) {
  if (useFallback) return jsonFallback.updateProducto(id, producto);
  await Producto.update(producto, { where: { id } });
}

// Eliminar producto
async function deleteProducto(id) {
  if (useFallback) return jsonFallback.deleteProducto(id);
  await Producto.destroy({ where: { id } });
}

// Verifica conexión al inicio
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Productos' : '🟢 DB conectada para Productos');
})();

module.exports = {
  getProductos,
  getProductoById,
  insertProducto,
  updateProducto,
  deleteProducto
};
