const fs = require('fs');
const path = require('path');
const { Venta, DetalleVenta } = require('../Models');
const productosBackend = require('../Productos/json');
const sesionesService = require('../Sesiones/service');
const VENTAS_FILE = path.join(__dirname, 'ventas.json');
const DETALLES_FILE = path.join(__dirname, 'detalles_venta.json');

// === Lectura y Escritura ===

function readVentas() {
  if (!fs.existsSync(VENTAS_FILE)) {
    fs.writeFileSync(VENTAS_FILE, '[]', 'utf8');
  }
  const data = fs.readFileSync(VENTAS_FILE, 'utf8');
  return JSON.parse(data);
}

function readDetalles() {
  if (!fs.existsSync(DETALLES_FILE)) {
    fs.writeFileSync(DETALLES_FILE, '[]', 'utf8');
  }
  const data = fs.readFileSync(DETALLES_FILE, 'utf8');
  return JSON.parse(data);
}

function writeVentas(data) {
  fs.writeFileSync(VENTAS_FILE, JSON.stringify(data, null, 2));
}

function writeDetalles(data) {
  fs.writeFileSync(DETALLES_FILE, JSON.stringify(data, null, 2));
}

// === Generadores dinámicos basados en modelos Sequelize ===

function generateDefaultVentaData(data = {}) {
  const fields = Venta.rawAttributes;
  const ventas = readVentas();
  const item = {};

  for (const fieldName in fields) {
    const field = fields[fieldName];

    if (data[fieldName] !== undefined) {
      item[fieldName] = data[fieldName];
      continue;
    }

    if (fieldName === 'id') {
      item.id = ventas.length ? ventas[ventas.length - 1].id + 1 : 1;
    } else if (field.defaultValue !== undefined) {
      item[fieldName] = typeof field.defaultValue === 'function'
        ? field.defaultValue()
        : field.defaultValue;
    } else if (field.allowNull) {
      item[fieldName] = null;
    }
  }

  if (!item.fecha_venta) {
    item.fecha_venta = new Date().toISOString();
  }

  return item;
}

function generateDefaultDetalleData(data = {}) {
  const fields = DetalleVenta.rawAttributes;
  const detalles = readDetalles();
  const item = {};

  for (const fieldName in fields) {
    const field = fields[fieldName];

    if (data[fieldName] !== undefined) {
      item[fieldName] = data[fieldName];
      continue;
    }

    if (fieldName === 'id') {
      item.id = detalles.length ? detalles[detalles.length - 1].id + 1 : 1;
    } else if (field.defaultValue !== undefined) {
      item[fieldName] = typeof field.defaultValue === 'function'
        ? field.defaultValue()
        : field.defaultValue;
    } else if (field.allowNull) {
      item[fieldName] = null;
    }
  }

  return item;
}

// === Funciones principales ===

async function getHistorial(usuario_id) {
  const ventas = readVentas();
  const detalles = readDetalles();
  const productos = await productosBackend.getProducto();

  const ventasUsuario = ventas
    .filter(v => v.usuario_id === Number(usuario_id))
    .sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta));

  return ventasUsuario.map(venta => ({
    id: venta.id,
    fecha: venta.fecha_venta,
    total: venta.total,
    estado: venta.estado,
    detalles: detalles
      .filter(d => d.venta_id === venta.id)
      .map(detalle => {
        const producto = productos.find(p => p.id === detalle.producto_id);
        return {
          producto: producto?.nombre || 'Desconocido',
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          descuento: detalle.descuento_aplicado,
          subtotal: detalle.subtotal
        };
      })
  }));
}

async function crearVenta(usuario_id, detalles, payment_id = null) {
  const ventas = readVentas();
  const detallesVenta = readDetalles();

  const total = detalles.reduce((sum, d) => 
    sum + (d.cantidad * d.precio_unitario * (1 - (d.descuento_aplicado || 0)/100)), 0);

  try {
    for (const detalle of detalles) {
      await productosBackend.reducirStock(detalle.producto_id, detalle.cantidad);
    }
  } catch (error) {
    throw new Error(`Error al procesar stock: ${error.message}`);
  }

  const nuevaVenta = generateDefaultVentaData({
    usuario_id: parseInt(usuario_id),
    fecha_venta: new Date().toISOString(),
    total,
    payment_id: payment_id || 'manual',
    estado: 'completada'
  });

  ventas.push(nuevaVenta);
  writeVentas(ventas);

  const nuevosDetalles = detalles.map(d => 
    generateDefaultDetalleData({
      venta_id: nuevaVenta.id,
      ...d
    })
  );

  detallesVenta.push(...nuevosDetalles);
  writeDetalles(detallesVenta);

  return Promise.resolve(nuevaVenta.id);
}

function actualizarEstadoVenta(venta_id, estado) {
  const ventas = readVentas();
  const index = ventas.findIndex(v => v.id === Number(venta_id));

  if (index === -1) {
    return Promise.reject(new Error('Venta no encontrada'));
  }

  ventas[index].estado = estado;
  writeVentas(ventas);
  return Promise.resolve();
}

// Agregar esta función después de getHistorial
async function getAllHistorial() {
  const ventas = readVentas();
  const detalles = readDetalles();
  const productos = await productosBackend.getProducto();

  const todasLasVentas = ventas
    .sort((a, b) => new Date(b.fecha_venta) - new Date(a.fecha_venta));

  // Obtener información de usuarios para cada venta
  const ventasConUsuarios = await Promise.all(
    todasLasVentas.map(async (venta) => {
      let usuarioInfo = {
        usuario_nombre: `Usuario #${venta.usuario_id}`,
        usuario_telefono: null,
        usuario_direccion: null,
        usuario_ciudad: null,
        usuario_region: null
      };

      try {
        // Intentar obtener información del usuario
        const usuario = await sesionesService.getUserById(venta.usuario_id);
        if (usuario) {
          usuarioInfo = {
            usuario_nombre: usuario.username || `Usuario #${venta.usuario_id}`,
            usuario_telefono: usuario.telefono || null,
            usuario_direccion: usuario.direccion || null,
            usuario_ciudad: usuario.ciudad || null,
            usuario_region: usuario.region || null
          };
        }
      } catch (error) {
        console.warn(`No se pudo obtener información del usuario ${venta.usuario_id}:`, error.message);
      }

      return {
        id: venta.id,
        fecha: venta.fecha_venta,
        total: venta.total,
        estado: venta.estado,
        usuario_id: venta.usuario_id,
        payment_id: venta.payment_id,
        ...usuarioInfo, // Incluir toda la información del usuario
        detalles: detalles
          .filter(d => d.venta_id === venta.id)
          .map(detalle => {
            const producto = productos.find(p => p.id === detalle.producto_id);
            return {
              producto_id: detalle.producto_id,
              producto: producto?.nombre || 'Desconocido',
              imagen_url: producto?.imagen_url,
              cantidad: detalle.cantidad,
              precio_unitario: detalle.precio_unitario,
              descuento: detalle.descuento_aplicado,
              subtotal: detalle.subtotal
            };
          })
      };
    })
  );

  return ventasConUsuarios;
}

module.exports = {
  getHistorial,
  getAllHistorial,  // Agregar esta línea
  crearVenta,
  actualizarEstadoVenta
};