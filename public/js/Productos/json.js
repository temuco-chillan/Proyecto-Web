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
  return readJSON(RELACION_FILE);
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
  const relaciones = getRelaciones();
  const categorias = getCategorias();

  const ids = relaciones
    .filter(r => r.producto_id === Number(productoId))
    .map(r => r.categoria_id);

  return categorias.filter(c => ids.includes(c.id));
}

// === Generador de producto desde modelo Sequelize actualizado ===
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

  // Campos específicos con valores por defecto
  if (!item.fecha_add) {
    item.fecha_add = new Date().toISOString();
  }
  
  // Asegurar que video_url esté incluido
  if (item.video_url === undefined) {
    item.video_url = null;
  }

  return item;
}

// === CRUD básico actualizado ===

function getProducto() {
  const productos = readData();
  return Promise.resolve(productos);
}

function getProductoById(id) {
  const productos = readData();
  const producto = productos.find(p => p.id === parseInt(id, 10));
  return Promise.resolve(producto || null);
}

function getProductoCompletoById(id) {
  const producto = getProductoById(id);
  const categorias = getCategoriasDeProducto(id);
  return Promise.resolve({ ...producto, categorias });
}

function insertProducto(productoData) {
  const productos = readData();
  
  // Incluir video_url en los datos del producto
  const newProduct = generateDefaultProductData({
    ...productoData,
    video_url: productoData.video_url || null
  });
  
  productos.push(newProduct);
  writeData(productos);
  
  if (productoData.categorias && Array.isArray(productoData.categorias)) {
    addRelaciones(newProduct.id, productoData.categorias);
  }
  
  return Promise.resolve(newProduct.id);
}

function updateProducto(id, productoData) {
  const productos = readData();
  const index = productos.findIndex(p => p.id === parseInt(id, 10));
  
  if (index === -1) {
    return Promise.reject(new Error('No encontrado'));
  }
  
  // Actualizar incluyendo video_url
  const updatedProduct = {
    ...productos[index],
    ...productoData,
    video_url: productoData.video_url !== undefined ? productoData.video_url : productos[index].video_url
  };
  
  productos[index] = updatedProduct;
  writeData(productos);
  
  if (productoData.categorias && Array.isArray(productoData.categorias)) {
    addRelaciones(parseInt(id, 10), productoData.categorias);
  }
  
  return Promise.resolve();
}

function deleteProducto(id) {
  const productos = readData();
  const index = productos.findIndex(p => p.id === parseInt(id, 10));
  
  if (index === -1) {
    return Promise.reject(new Error('No encontrado'));
  }
  
  productos.splice(index, 1);
  writeData(productos);
  return Promise.resolve();
}

// Nueva función para reducir stock
function reducirStock(producto_id, cantidad) {
  const productos = readData();
  const index = productos.findIndex(p => p.id === parseInt(producto_id, 10));
  
  if (index === -1) {
    return Promise.reject(new Error(`Producto con ID ${producto_id} no encontrado`));
  }
  
  const producto = productos[index];
  
  if (producto.stock < cantidad) {
    return Promise.reject(new Error(`Stock insuficiente para el producto ${producto.nombre}. Stock actual: ${producto.stock}, cantidad solicitada: ${cantidad}`));
  }
  
  const nuevoStock = producto.stock - cantidad;
  productos[index].stock = nuevoStock;
  writeData(productos);
  
  return Promise.resolve(nuevoStock);
}

module.exports = {
  getProducto,
  getProductoById,
  getProductoCompletoById,
  insertProducto,
  updateProducto,
  deleteProducto,
  getCategorias,
  getCategoriasDeProducto,
  getRelaciones,
  reducirStock  // ← Agregar esta función al export
};
