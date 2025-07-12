const { Producto, Categoria } = require('../Models');
const jsonFallback = require('./json');
const { getRelaciones,getCategorias } = require('../Productos/json');
let useFallback = false;

// Verifica conexión a la base de datos
async function isConnected() {
  try {
    await Producto.sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Base de datos no disponible:', error.message);
    return false;
  }
}

// === CRUD de Productos ===

async function getProductos() {
  if (useFallback) return jsonFallback.getProducto();
  return await Producto.findAll();
}

async function getProductoById(id) {
  if (useFallback) return jsonFallback.getProductoById(id);
  return await Producto.findByPk(id);
}

async function insertProducto(data) {
  if (useFallback) return jsonFallback.insertProducto(data);

  const { categorias = [], ...productoData } = data;
  const producto = await Producto.create(productoData);

  if (Array.isArray(categorias) && categorias.length > 0) {
    await producto.setCategorias(categorias);
  }

  return producto.id;
}

async function updateProducto(id, data) {
  if (useFallback) return jsonFallback.updateProducto(id, data);

  const { categorias, ...productoData } = data;
  const producto = await Producto.findByPk(id);
  if (!producto) throw new Error('No encontrado');

  await producto.update(productoData);

  if (Array.isArray(categorias)) {
    await producto.setCategorias(categorias);
  }
}

async function deleteProducto(id) {
  if (useFallback) return jsonFallback.deleteProducto(id);
  await Producto.destroy({ where: { id } });
}

// === Relación Producto <-> Categorías ===

function getCategoriasDeProducto(productoId) {
  const relaciones = getRelaciones();        // lee ProductoCategorias.json
  const categorias = getCategorias();        // lee Categorias.json
  const ids = relaciones
    .filter(r => r.producto_id === Number(productoId))
    .map(r => r.categoria_id);

  return categorias.filter(c => ids.includes(c.id));
}


async function asignarCategoriasAProducto(productoId, categoriaIds) {
  if (useFallback) return jsonFallback.asignarCategoriasAProducto(productoId, categoriaIds);

  const producto = await Producto.findByPk(productoId);
  if (!producto) throw new Error('Producto no encontrado');

  await producto.setCategorias(categoriaIds);
  return true;
}

async function agregarCategoriaAProducto(productoId, categoriaId) {
  if (useFallback) return jsonFallback.agregarCategoriaAProducto(productoId, categoriaId);

  const producto = await Producto.findByPk(productoId);
  if (!producto) throw new Error('Producto no encontrado');

  await producto.addCategoria(categoriaId);
  return true;
}

async function quitarCategoriaAProducto(productoId, categoriaId) {
  if (useFallback) return jsonFallback.quitarCategoriaAProducto(productoId, categoriaId);

  const producto = await Producto.findByPk(productoId);
  if (!producto) throw new Error('Producto no encontrado');

  await producto.removeCategoria(categoriaId);
  return true;
}

// === Inicializa fallback automáticamente ===
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Productos' : '🟢 DB conectada para Productos');
})();


// === Exportar funciones ===
module.exports = {
  getProductos,
  getProductoById,
  insertProducto,
  updateProducto,
  deleteProducto,
  getCategoriasDeProducto,
  asignarCategoriasAProducto,
  agregarCategoriaAProducto,
  quitarCategoriaAProducto
};
