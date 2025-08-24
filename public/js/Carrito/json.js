const fs = require('fs');
const path = require('path');
const { Carrito } = require('../Models');
const productosBackend = require('../Productos/json');

const CARRITO_FILE = path.join(__dirname, 'carrito.json');
const DESCUENTOS_FILE = path.join(__dirname, '../Descuentos/descuentos.json');

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

// === Funciones de descuentos ===

function readDescuentos() {
  if (!fs.existsSync(DESCUENTOS_FILE)) {
    const defaultDescuentos = [
      { id: 1, producto_id: 1, cantidad_minima: 3, porcentaje_descuento: 5.00, activo: true },
      { id: 2, producto_id: 1, cantidad_minima: 5, porcentaje_descuento: 10.00, activo: true },
      { id: 3, producto_id: 1, cantidad_minima: 10, porcentaje_descuento: 15.00, activo: true }
    ];
    fs.writeFileSync(DESCUENTOS_FILE, JSON.stringify(defaultDescuentos, null, 2));
  }
  const data = fs.readFileSync(DESCUENTOS_FILE, 'utf8');
  return JSON.parse(data);
}

function calcularDescuentoPorCantidad(producto_id, cantidad) {
  const descuentos = readDescuentos();
  
  const descuentosProducto = descuentos
    .filter(d => d.producto_id === Number(producto_id) && d.activo)
    .filter(d => d.cantidad_minima <= cantidad)
    .sort((a, b) => b.cantidad_minima - a.cantidad_minima);
  
  return descuentosProducto.length > 0 ? descuentosProducto[0].porcentaje_descuento : 0;
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

// === Funciones principales actualizadas ===

async function getCarrito(usuario_id) {
  const data = readCarrito();
  const productos = await productosBackend.getProducto();

  const itemsUsuario = data.filter(item => item.usuario_id === Number(usuario_id));

  const enriquecido = itemsUsuario.map(item => {
    const prod = productos.find(p => p.id === item.producto_id);
    
    const precio_original = parseFloat(prod?.precio || 0);
    let precio_final = precio_original;
    let descuento_total = 0;
    
    // 1. Aplicar descuento individual del producto
    const descuento_individual = parseFloat(prod?.descuento || 0);
    if (descuento_individual > 0) {
      precio_final = precio_final * (1 - descuento_individual / 100);
      descuento_total += descuento_individual;
    }
    
    // 2. Aplicar descuento por cantidad SOBRE EL PRECIO YA DESCONTADO
    const descuento_cantidad = calcularDescuentoPorCantidad(item.producto_id, item.cantidad);
    if (descuento_cantidad > 0) {
    // Aplicar descuento por cantidad sobre el precio ya descontado
    precio_final = precio_final * (1 - descuento_cantidad / 100);
    // ✅ CORRECCIÓN: Calcular el descuento total efectivo correctamente
    descuento_total = ((precio_original - precio_final) / precio_original) * 100;
    }
    
    return {
      producto_id: item.producto_id,
      cantidad: item.cantidad,
      nombre: prod?.nombre || 'Desconocido',
      precio: precio_final,
      precio_original: precio_original,
      precio_con_descuento: precio_final,
      descuento_aplicado: descuento_total,
      descuento_individual: descuento_individual,
      descuento_cantidad: descuento_cantidad,
      subtotal: precio_final * item.cantidad,
      imagen_url: prod?.imagen_url || null,
      video_url: prod?.video_url || null,
      stock: prod?.stock || 0
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
  const idNumerico = Number(usuario_id);
  const data = readCarrito().filter(p => p.usuario_id !== idNumerico);
  writeCarrito(data);
  return Promise.resolve();
}

module.exports = {
  getCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
  calcularDescuentoPorCantidad
};
