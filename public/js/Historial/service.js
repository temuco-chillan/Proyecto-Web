const { Venta, DetalleVenta, Producto } = require('../Models');
const jsonFallback = require('./json');

let useFallback = false;

// Verifica si la base está conectada al iniciar
async function isConnected() {
  try {
    await Venta.sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}

// Obtener historial de ventas
async function getHistorial(usuario_id) {
  if (useFallback) return jsonFallback.getHistorial(usuario_id);

  const ventas = await Venta.findAll({
    where: { usuario_id },
    include: [{
      model: DetalleVenta,
      include: [{
        model: Producto,
        attributes: ['nombre']
      }]
    }],
    order: [['fecha_venta', 'DESC']]
  });

  return ventas.map(venta => ({
    id: venta.id,
    fecha: venta.fecha_venta,
    total: venta.total,
    estado: venta.estado,
    detalles: venta.DetalleVentas.map(detalle => ({
      producto: detalle.Producto.nombre,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      descuento: detalle.descuento_aplicado,
      subtotal: detalle.subtotal
    }))
  }));
}

// Crear nueva venta
async function crearVenta(usuario_id, detalles) {
  if (useFallback) return jsonFallback.crearVenta(usuario_id, detalles);

  const total = detalles.reduce((sum, d) => 
    sum + (d.cantidad * d.precio_unitario * (1 - d.descuento_aplicado/100)), 0);

  const venta = await Venta.create({
    usuario_id,
    total,
    estado: 'completada'
  });

  await DetalleVenta.bulkCreate(detalles.map(d => ({
    venta_id: venta.id,
    ...d
  })));

  return venta.id;
}

// Actualizar estado de venta
async function actualizarEstadoVenta(venta_id, estado) {
  if (useFallback) return jsonFallback.actualizarEstadoVenta(venta_id, estado);

  await Venta.update(
    { estado },
    { where: { id: venta_id } }
  );
}

// Inicializa el sistema y decide si usar fallback
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Historial' : '🟢 DB conectada para Historial');
})();

module.exports = {
  getHistorial,
  crearVenta,
  actualizarEstadoVenta
};