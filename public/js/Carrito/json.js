const fs = require('fs');
const path = require('path');
const { Carrito } = require('../Models');
const productosBackend = require('../Productos/json');

const CARRITO_FILE = path.join(__dirname, 'carrito.json');

// === Lectura y Escritura ===

function readCarrito() {
  if (!fs.existsSync(CARRITO_FILE)) {
    fs.writeFileSync(CARRITO_FILE, '[]', 'utf8');
  }
  const data = fs.readFileSync(CARRITO_FILE, 'utf8');
  return JSON.parse(data);
}

function writeCarrito(data) {
  fs.writeFileSync(CARRITO_FILE, JSON.stringify(data, null, 2));
}

// === Generador dinámico basado en el modelo Sequelize ===

function generateDefaultCartData(data = {}) {
  const fields = Carrito.rawAttributes;
  const carrito = readCarrito();
  const item = {};

  for (const fieldName in fields) {
    const field = fields[fieldName];

    if (data[fieldName] !== undefined) {
      item[fieldName] = data[fieldName];
      continue;
    }

    if (fieldName === 'id') {
      item.id = carrito.length ? carrito[carrito.length - 1].id + 1 : 1;
    } else if (field.defaultValue !== undefined) {
      item[fieldName] = typeof field.defaultValue === 'function'
        ? field.defaultValue()
        : field.defaultValue;
    } else if (field.allowNull) {
      item[fieldName] = null;
    }
  }

  if (!item.fecha_add) {
    item.fecha_add = new Date().toISOString();
  }

  return item;
}

// === Funciones principales ===

async function getCarrito(usuario_id) {
  const data = readCarrito();
  const productos = await productosBackend.getProducto();

  const itemsUsuario = data.filter(item => item.usuario_id === Number(usuario_id));

  const enriquecido = itemsUsuario.map(item => {
    const prod = productos.find(p => p.id === item.producto_id);
    return {
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      nombre: prod?.nombre || 'Desconocido',
      precio: prod?.precio || null
    };
  });

  return enriquecido;
}

function agregarAlCarrito(usuario_id, producto_id, cantidad = 1) {
  const data = readCarrito();
  const index = data.findIndex(p =>
    p.usuario_id === Number(usuario_id) && p.producto_id === Number(producto_id)
  );

  if (index >= 0) {
    data[index].cantidad += cantidad;
  } else {
    const newItem = generateDefaultCartData({
      usuario_id,
      producto_id,
      cantidad
    });
    data.push(newItem);
  }

  writeCarrito(data);
  return Promise.resolve();
}

function actualizarCantidadCarrito(usuario_id, producto_id, cantidad) {
  const data = readCarrito();
  const index = data.findIndex(p =>
    p.usuario_id === Number(usuario_id) && p.producto_id === Number(producto_id)
  );

  if (index === -1) {
    return Promise.reject(new Error('Producto no encontrado en carrito'));
  }

  data[index].cantidad = cantidad;
  writeCarrito(data);
  return Promise.resolve();
}

function eliminarDelCarrito(usuario_id, producto_id) {
  const data = readCarrito().filter(p =>
    !(p.usuario_id === usuario_id && p.producto_id === producto_id)
  );
  writeCarrito(data);
  return Promise.resolve();
}

function vaciarCarrito(usuario_id) {
  const data = readCarrito().filter(p => p.usuario_id !== usuario_id);
  writeCarrito(data);
  return Promise.resolve();
}

module.exports = {
  getCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito
};
