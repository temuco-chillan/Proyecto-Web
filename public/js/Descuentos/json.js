const fs = require('fs');
const path = require('path');

const DESCUENTOS_FILE = path.join(__dirname, 'descuentos.json');

// === Utilidades JSON ===

function loadDescuentos() {
  if (!fs.existsSync(DESCUENTOS_FILE)) {
    const defaultDescuentos = [
      { id: 1, producto_id: 1, cantidad_minima: 3, porcentaje_descuento: 5.00, activo: true, fecha_creacion: new Date().toISOString() },
      { id: 2, producto_id: 1, cantidad_minima: 5, porcentaje_descuento: 10.00, activo: true, fecha_creacion: new Date().toISOString() },
      { id: 3, producto_id: 1, cantidad_minima: 10, porcentaje_descuento: 15.00, activo: true, fecha_creacion: new Date().toISOString() }
    ];
    fs.writeFileSync(DESCUENTOS_FILE, JSON.stringify(defaultDescuentos, null, 2));
  }
  return JSON.parse(fs.readFileSync(DESCUENTOS_FILE, 'utf8'));
}

function saveDescuentos(descuentos) {
  fs.writeFileSync(DESCUENTOS_FILE, JSON.stringify(descuentos, null, 2));
}

// === Funciones principales ===

function calcularDescuentoPorCantidad(producto_id, cantidad) {
  const descuentos = loadDescuentos();
  
  const descuentosProducto = descuentos
    .filter(d => d.producto_id === Number(producto_id) && d.activo)
    .filter(d => d.cantidad_minima <= cantidad)
    .sort((a, b) => b.cantidad_minima - a.cantidad_minima);
  
  return descuentosProducto.length > 0 ? descuentosProducto[0].porcentaje_descuento : 0;
}

function getDescuentosProducto(producto_id) {
  const descuentos = loadDescuentos();
  return descuentos.filter(d => d.producto_id === Number(producto_id) && d.activo);
}

function crearDescuento(producto_id, cantidad_minima, porcentaje_descuento) {
  const descuentos = loadDescuentos();
  
  // Verificar si ya existe
  const existeIndex = descuentos.findIndex(d => 
    d.producto_id === Number(producto_id) && d.cantidad_minima === Number(cantidad_minima)
  );
  
  if (existeIndex >= 0) {
    // Actualizar existente
    descuentos[existeIndex].porcentaje_descuento = Number(porcentaje_descuento);
    descuentos[existeIndex].activo = true;
  } else {
    // Crear nuevo
    const newId = descuentos.length > 0 ? Math.max(...descuentos.map(d => d.id)) + 1 : 1;
    descuentos.push({
      id: newId,
      producto_id: Number(producto_id),
      cantidad_minima: Number(cantidad_minima),
      porcentaje_descuento: Number(porcentaje_descuento),
      activo: true,
      fecha_creacion: new Date().toISOString()
    });
  }
  
  saveDescuentos(descuentos);
  return true;
}

function eliminarDescuento(id) {
  const descuentos = loadDescuentos();
  const index = descuentos.findIndex(d => d.id === Number(id));
  
  if (index >= 0) {
    descuentos[index].activo = false;
    saveDescuentos(descuentos);
    return true;
  }
  
  return false;
}

function getAllDescuentos() {
  return loadDescuentos();
}

module.exports = {
  calcularDescuentoPorCantidad,
  getDescuentosProducto,
  crearDescuento,
  eliminarDescuento,
  getAllDescuentos
};