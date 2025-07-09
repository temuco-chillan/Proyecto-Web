const fs = require('fs');
const path = require('path');
const { Producto } = require('../Models');

const DATA_FILE = path.join(__dirname, 'Productos.json');
const ESTADOS_VALIDOS = ['activo', 'inactivo', 'mantenimiento'];

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

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

function getProducto() {
  return Promise.resolve(readData());
}

function getProductoById(id) {
  const data = readData();
  const producto = data.find(p => p.id === Number(id));
  return Promise.resolve(producto || null);
}

function insertProducto(productoData) {
  if (!ESTADOS_VALIDOS.includes(productoData.estado)) {
    return Promise.reject(new Error('Estado inválido'));
  }

  const data = readData();
  const newProducto = generateDefaultProductData(productoData);
  data.push(newProducto);
  writeData(data);
  return Promise.resolve(newProducto.id);
}

function updateProducto(id, productoData) {
  const data = readData();
  const index = data.findIndex(p => p.id === Number(id));
  if (index === -1) return Promise.reject(new Error('No encontrado'));

  if (!ESTADOS_VALIDOS.includes(productoData.estado)) {
    return Promise.reject(new Error('Estado inválido'));
  }

  productoData.id = Number(id);
  productoData.fecha_add = data[index].fecha_add || new Date().toISOString();

  data[index] = productoData;
  writeData(data);
  return Promise.resolve();
}

function deleteProducto(id) {
  const data = readData();
  const index = data.findIndex(p => p.id === Number(id));
  if (index === -1) return Promise.reject(new Error('No encontrado'));

  data.splice(index, 1);
  writeData(data);
  return Promise.resolve();
}

module.exports = {
  getProducto,
  getProductoById,
  insertProducto,
  updateProducto,
  deleteProducto
};
