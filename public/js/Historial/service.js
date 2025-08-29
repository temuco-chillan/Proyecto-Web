const { Venta, DetalleVenta, Producto, Usuario } = require('../Models');
const jsonFallback = require('./json');
const productosService = require('../Productos/service');

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
      as: 'detalles',
      include: [{
        model: Producto,
        attributes: ['id', 'nombre', 'imagen_url']
      }]
    }],
    order: [['fecha_venta', 'DESC']]
  });

  return ventas.map(venta => ({
    id: venta.id,
    fecha: venta.fecha_venta,
    total: venta.total,
    payment_id: venta.payment_id,
    estado: venta.estado,
    detalles: venta.detalles.map(detalle => ({  // Cambiar de DetalleVentas a detalles
      producto_id: detalle.Producto.id,
      producto: detalle.Producto.nombre,
      imagen_url: detalle.Producto.imagen_url,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      descuento: detalle.descuento_aplicado,
      subtotal: detalle.subtotal
    }))
  }));
}

// Obtener historial de todas las ventas (para administrador)
async function getAllHistorial() {
  if (useFallback) return jsonFallback.getAllHistorial();

  const ventas = await Venta.findAll({
    include: [
      {
        model: DetalleVenta,
        as: 'detalles',  // Usar el alias
        include: [{
          model: Producto,
          attributes: ['id', 'nombre', 'imagen_url']
        }]
      },
      {
        model: Usuario,
        attributes: ['id', 'username', 'telefono', 'direccion', 'ciudad', 'region']
      }
    ],
    order: [['fecha_venta', 'DESC']]
  });

  return ventas.map(venta => ({
    id: venta.id,
    fecha: venta.fecha_venta,
    total: venta.total,
    payment_id: venta.payment_id,
    estado: venta.estado,
    usuario_id: venta.usuario_id,
    usuario_nombre: venta.Usuario ? venta.Usuario.username : `Usuario #${venta.usuario_id}`,
    usuario_telefono: venta.Usuario ? venta.Usuario.telefono : null,
    usuario_direccion: venta.Usuario ? venta.Usuario.direccion : null,
    usuario_ciudad: venta.Usuario ? venta.Usuario.ciudad : null,
    usuario_region: venta.Usuario ? venta.Usuario.region : null,
    detalles: venta.detalles.map(detalle => ({  // Cambiar de DetalleVentas a detalles
      producto_id: detalle.Producto.id,         
      producto: detalle.Producto.nombre,
      imagen_url: detalle.Producto.imagen_url,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      descuento: detalle.descuento_aplicado,
      subtotal: detalle.subtotal
    }))
  }));
}

// Crear nueva venta
async function crearVenta(usuario_id, detalles, payment_id = null) {
  if (useFallback) return jsonFallback.crearVenta(parseInt(usuario_id), detalles, payment_id);

  const total = detalles.reduce((sum, d) => 
    sum + (d.cantidad * d.precio_unitario * (1 - (d.descuento_aplicado || 0)/100)), 0);

  // Verificar y reducir stock antes de crear la venta
  try {
    for (const detalle of detalles) {
      await productosService.reducirStock(detalle.producto_id, detalle.cantidad);
    }
  } catch (error) {
    throw new Error(`Error al procesar stock: ${error.message}`);
  }

  const venta = await Venta.create({
    usuario_id: parseInt(usuario_id),
    fecha_venta: new Date(),
    total,
    payment_id: payment_id || 'manual',
    estado: 'completada'
  });

  // Asegurar que todos los detalles tengan los campos necesarios
  const detallesCompletos = detalles.map(d => ({
    venta_id: venta.id,
    producto_id: d.producto_id,
    cantidad: d.cantidad,
    precio_unitario: d.precio_unitario,
    descuento_aplicado: d.descuento_aplicado || 0,
    subtotal: d.subtotal || (d.cantidad * d.precio_unitario * (1 - (d.descuento_aplicado || 0)/100))
  }));

  await DetalleVenta.bulkCreate(detallesCompletos);

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

// Obtener venta por payment_id para evitar duplicados
async function getVentaByPaymentId(payment_id) {
  if (useFallback) return null; // En modo fallback, no verificamos duplicados

  try {
    const venta = await Venta.findOne({
      where: { payment_id },
      include: [{
        model: DetalleVenta,
        as: 'detalles',
        include: [{
          model: Producto,
          attributes: ['id', 'nombre', 'imagen_url']
        }]
      }]
    });

    if (!venta) return null;

    return {
      id: venta.id,
      usuario_id: venta.usuario_id,
      fecha_venta: venta.fecha_venta,
      subtotal: venta.total,
      payment_id: venta.payment_id,
      estado: venta.estado,
      detalles: venta.detalles.map(detalle => ({
        producto_id: detalle.Producto.id,
        producto: detalle.Producto.nombre,
        imagen_url: detalle.Producto.imagen_url,
        cantidad: detalle.cantidad,
        precio_unitario: detalle.precio_unitario,
        descuento: detalle.descuento_aplicado,
        subtotal: detalle.subtotal
      }))
    };
  } catch (error) {
    console.error('Error al buscar venta por payment_id:', error);
    return null;
  }
}

// Inicializa el sistema y decide si usar fallback
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Historial' : '🟢 DB conectada para Historial');
})();

module.exports = {
  getHistorial,
  getAllHistorial,
  crearVenta,
  actualizarEstadoVenta,
  getVentaByPaymentId
};