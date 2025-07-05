const fs = require('fs');
const path = require('path');
const productosBackend = require('../Productos/json'); 

const CARRITO_FILE = path.join(__dirname, 'carrito.json');

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

async function getCarrito(usuario_id) {
  const data = readCarrito();
  const productos = await productosBackend.getComputadores();

  const itemsUsuario = data.filter(item => item.usuario_id === Number(usuario_id));

  const enriquecido = itemsUsuario.map(item => {
    const prod = productos.find(p => p.id === item.producto_id);
    return {
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      nombre_maquina: prod?.nombre_maquina || 'Desconocido',
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
    data.push({
      usuario_id,
      producto_id,
      cantidad,
      fecha_add: new Date().toISOString()
    });
  }
  writeCarrito(data);
  return Promise.resolve();
}

function actualizarCantidadCarrito(usuario_id, producto_id, cantidad) {
  const data = readCarrito();
  const index = data.findIndex(p =>
  p.usuario_id === Number(usuario_id) && p.producto_id === Number(producto_id)
  );
  if (index === -1) return Promise.reject(new Error('Producto no encontrado en carrito'));
  data[index].cantidad = cantidad;
  writeCarrito(data);
  return Promise.resolve();
}

function eliminarDelCarrito(usuario_id, producto_id) {
  const data = readCarrito().filter(p => !(p.usuario_id === usuario_id && p.producto_id === producto_id));
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
