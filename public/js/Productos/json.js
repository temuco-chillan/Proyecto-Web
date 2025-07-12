const fs = require('fs');
const path = require('path');
const { Producto } = require('../Models');

// Rutas a los archivos JSON
const PRODUCTOS_FILE = path.join(__dirname, 'Productos.json');
const CATEGORIAS_FILE = path.join(__dirname, '../Categorias/Categorias.json');
const RELACION_FILE = path.join(__dirname, '../Categorias/ProductoCategorias.json');

const ESTADOS_VALIDOS = ['activo', 'inactivo', 'mantenimiento'];

// === Utilidades base ===
function readJSON(file, fallback = []) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback), 'utf8');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// === Lectura principal de productos ===
function readData() {
  return readJSON(PRODUCTOS_FILE);
}

function writeData(data) {
  writeJSON(PRODUCTOS_FILE, data);
}

// === Categorías y relaciones ===
function getCategorias() {
  return readJSON(CATEGORIAS_FILE);
}

function getRelaciones() {
  return readJSON(RELACION_FILE); // ← este archivo debe estar definido arriba
}


function addRelaciones(productoId, categoriaIds = []) {
  const relaciones = getRelaciones();
  const nuevasRelaciones = categoriaIds.map(id => ({
    producto_id: productoId,
    categoria_id: id
  }));
  const sinProducto = relaciones.filter(r => r.producto_id !== productoId);
  writeJSON(RELACION_FILE, [...sinProducto, ...nuevasRelaciones]);
}

function getCategoriasDeProducto(productoId) {
  const relaciones = getRelaciones();        // ProductoCategorias.json
  const categorias = getCategorias();        // Categorias.json

  const ids = relaciones
    .filter(r => r.producto_id === Number(productoId))
    .map(r => r.categoria_id);

  return categorias.filter(c => ids.includes(c.id));
}



// === Generador de producto desde modelo Sequelize ===
function generateDefaultProductData(data = {}) {
  const fields = Producto.rawAttributes;
  const productos = readData();
  const item = {};

  for (const fieldName in fields) {
    const field = fields[fieldName];

    if (data[fieldName] !== undefined) {
      item[fieldName] = data[fieldName];
      continue;
    }

    if (fieldName === 'id') {
      item.id = productos.length ? Math.max(...productos.map(p => p.id)) + 1 : 1;
    } else if (field.defaultValue !== undefined) {
      item[fieldName] = typeof field.defaultValue === 'function'
        ? field.defaultValue()
        : field.defaultValue;
    } else if (field.allowNull || field.allowNull === undefined) {
      item[fieldName] = null;
    }
  }

  if (!item.fecha_add) {
    item.fecha_add = new Date().toISOString();
  }

  return item;
}

// === CRUD básico ===

function getProducto() {
  const productos = readData();
  return Promise.resolve(productos);
}

function getProductoById(id) {
  const productos = readData();
  const producto = productos.find(p => p.id === Number(id));
  return Promise.resolve(producto || null);
}

// Producto + categorías
function getProductoCompletoById(id) {
  const producto = readData().find(p => p.id === Number(id));
  if (!producto) return Promise.resolve(null);
  const categorias = getCategoriasDeProducto(producto.id);
  return Promise.resolve({ ...producto, categorias });
}

function insertProducto(productoData) {
  if (!ESTADOS_VALIDOS.includes(productoData.estado)) {
    return Promise.reject(new Error('Estado inválido'));
  }

  const productos = readData();
  const nuevo = generateDefaultProductData(productoData);
  productos.push(nuevo);
  writeData(productos);

  if (productoData.categorias && Array.isArray(productoData.categorias)) {
    addRelaciones(nuevo.id, productoData.categorias);
  }

  return Promise.resolve(nuevo.id);
}

function updateProducto(id, productoData) {
  const productos = readData();
  const index = productos.findIndex(p => p.id === Number(id));
  if (index === -1) return Promise.reject(new Error('No encontrado'));

  if (!ESTADOS_VALIDOS.includes(productoData.estado)) {
    return Promise.reject(new Error('Estado inválido'));
  }

  productoData.id = Number(id);
  productoData.fecha_add = productos[index].fecha_add || new Date().toISOString();

  productos[index] = productoData;
  writeData(productos);

  if (productoData.categorias && Array.isArray(productoData.categorias)) {
    addRelaciones(productoData.id, productoData.categorias);
  }

  return Promise.resolve();
}

function deleteProducto(id) {
  const productos = readData();
  const index = productos.findIndex(p => p.id === Number(id));
  if (index === -1) return Promise.reject(new Error('No encontrado'));

  productos.splice(index, 1);
  writeData(productos);

  // Eliminar también relaciones
  const relaciones = getRelaciones().filter(r => r.producto_id !== Number(id));
  writeJSON(RELACION_FILE, relaciones);

  return Promise.resolve();
}

// === Exportar todo ===
module.exports = {
  getProducto,
  getProductoById,
  getProductoCompletoById,
  insertProducto,
  updateProducto,
  deleteProducto,
  getCategorias,
  getCategoriasDeProducto,
  getRelaciones
};
