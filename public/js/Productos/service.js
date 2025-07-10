const { Producto, Categoria } = require('../Models');
const jsonFallback = require('./json');

let useFallback = false;

// Verificar conexión
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
async function insertProducto(data) {
  if (useFallback) return jsonFallback.insertProducto(data);

  const { categorias = [], ...productoData } = data;
  const producto = await Producto.create(productoData);

  if (Array.isArray(categorias) && categorias.length > 0) {
    await producto.setCategorias(categorias);
  }

  return producto.id;
}

// Actualizar producto
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

// Eliminar producto
async function deleteProducto(id) {
  if (useFallback) return jsonFallback.deleteProducto(id);
  await Producto.destroy({ where: { id } });
}

// Obtener categorías de un producto
async function getCategoriasDeProducto(productoId) {
  if (useFallback) return jsonFallback.getCategoriasDeProducto(productoId);

  console.log('🔍 Buscando producto ID:', productoId);

  const producto = await Producto.findByPk(productoId, {
    include: [{
      model: Categoria,
      as: 'Categorias',
      through: { attributes: [] }
    }]
  });

  if (!producto) {
    console.log('❌ Producto no encontrado');
    return null;
  }

  console.log('✅ Producto encontrado:', producto.nombre);
  console.log('📦 Categorías asociadas:', producto.Categorias);

  return producto.Categorias;
}

// Asignar todas las categorías
async function asignarCategoriasAProducto(productoId, categoriaIds) {
  if (useFallback) return jsonFallback.asignarCategoriasAProducto(productoId, categoriaIds);

  const producto = await Producto.findByPk(productoId);
  if (!producto) throw new Error('Producto no encontrado');

  await producto.setCategorias(categoriaIds);
  return true;
}

// Agregar una categoría
async function agregarCategoriaAProducto(productoId, categoriaId) {
  if (useFallback) return jsonFallback.agregarCategoriaAProducto(productoId, categoriaId);

  const producto = await Producto.findByPk(productoId);
  if (!producto) throw new Error('Producto no encontrado');

  await producto.addCategoria(categoriaId);
  return true;
}

// Quitar una categoría
async function quitarCategoriaAProducto(productoId, categoriaId) {
  if (useFallback) return jsonFallback.quitarCategoriaAProducto(productoId, categoriaId);

  const producto = await Producto.findByPk(productoId);
  if (!producto) throw new Error('Producto no encontrado');

  await producto.removeCategoria(categoriaId);
  return true;
}

// Inicializa fallback
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Productos' : '🟢 DB conectada para Productos');
})();

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
