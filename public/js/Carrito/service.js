const { Carrito, Producto } = require('../models');
const jsonFallback = require('../Carrito/json');

let useFallback = false;

// Verifica si la base está conectada al iniciar
async function isConnected() {
  try {
    await Carrito.sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}

// Obtener carrito
async function getCarrito(usuario_id) {
  if (useFallback) return jsonFallback.getCarrito(usuario_id);

  const carrito = await Carrito.findAll({
    where: { usuario_id },
    include: {
      model: Producto,
      attributes: ['nombre', 'precio']
    }
  });

  return carrito.map(item => ({
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    nombre_Producto: item.Producto.nombre,
    precio: item.Producto.precio
  }));
}

// Agregar producto
async function agregarAlCarrito(usuario_id, producto_id, cantidad = 1) {
  if (useFallback) return jsonFallback.agregarAlCarrito(usuario_id, producto_id, cantidad);

  const [item, created] = await Carrito.findOrCreate({
    where: { usuario_id, producto_id },
    defaults: { cantidad }
  });

  if (!created) {
    item.cantidad += cantidad;
    await item.save();
  }
}

// Actualizar cantidad
async function actualizarCantidadCarrito(usuario_id, producto_id, cantidad) {
  if (useFallback) return jsonFallback.actualizarCantidadCarrito(usuario_id, producto_id, cantidad);

  await Carrito.update(
    { cantidad },
    { where: { usuario_id, producto_id } }
  );
}

// Eliminar producto
async function eliminarDelCarrito(usuario_id, producto_id) {
  if (useFallback) return jsonFallback.eliminarDelCarrito(usuario_id, producto_id);

  await Carrito.destroy({ where: { usuario_id, producto_id } });
}

// Vaciar carrito
async function vaciarCarrito(usuario_id) {
  if (useFallback) return jsonFallback.vaciarCarrito(usuario_id);

  await Carrito.destroy({ where: { usuario_id } });
}

// Inicializa el sistema y decide si usar fallback
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? 'Fallback JSON activado' : 'Conectado a base de datos');
})();

module.exports = {
  getCarrito,
  agregarAlCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito
};
