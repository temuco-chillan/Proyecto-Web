const fs = require('fs');
const path = require('path');

const DESCUENTOS_FILE = path.join(__dirname, 'descuentos.json');

// === Utilidades JSON ===

/**
 * Carga los descuentos desde el archivo JSON
 * @returns {Array} Array de descuentos
 */
function loadDescuentos() {
  if (!fs.existsSync(DESCUENTOS_FILE)) {
    const defaultDescuentos = [
      { 
        id: 1, 
        producto_id: 1, 
        cantidad_minima: 3, 
        porcentaje_descuento: 5.00, 
        activo: true, 
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      { 
        id: 2, 
        producto_id: 1, 
        cantidad_minima: 5, 
        porcentaje_descuento: 10.00, 
        activo: true, 
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      },
      { 
        id: 3, 
        producto_id: 1, 
        cantidad_minima: 10, 
        porcentaje_descuento: 15.00, 
        activo: true, 
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString()
      }
    ];
    fs.writeFileSync(DESCUENTOS_FILE, JSON.stringify(defaultDescuentos, null, 2));
  }
  return JSON.parse(fs.readFileSync(DESCUENTOS_FILE, 'utf8'));
}

/**
 * Guarda los descuentos en el archivo JSON
 * @param {Array} descuentos - Array de descuentos a guardar
 */
function saveDescuentos(descuentos) {
  fs.writeFileSync(DESCUENTOS_FILE, JSON.stringify(descuentos, null, 2));
}

// === Funciones principales ===

/**
 * Calcula el descuento por cantidad para un producto específico
 * @param {number} producto_id - ID del producto
 * @param {number} cantidad - Cantidad del producto
 * @returns {number} Porcentaje de descuento aplicable
 */
function calcularDescuentoPorCantidad(producto_id, cantidad) {
  const descuentos = loadDescuentos();
  
  const descuentosProducto = descuentos
    .filter(d => d.producto_id === Number(producto_id) && d.activo)
    .filter(d => d.cantidad_minima <= cantidad)
    .sort((a, b) => b.cantidad_minima - a.cantidad_minima);
  
  return descuentosProducto.length > 0 ? descuentosProducto[0].porcentaje_descuento : 0;
}

/**
 * Obtiene todos los descuentos activos para un producto específico
 * @param {number} producto_id - ID del producto
 * @returns {Array} Array de descuentos del producto
 */
function getDescuentosProducto(producto_id) {
  const descuentos = loadDescuentos();
  return descuentos.filter(d => d.producto_id === Number(producto_id) && d.activo);
}

/**
 * Crea un nuevo descuento
 * @param {number} producto_id - ID del producto
 * @param {number} cantidad_minima - Cantidad mínima para aplicar el descuento
 * @param {number} porcentaje_descuento - Porcentaje de descuento
 * @returns {boolean} Éxito de la operación
 */
function crearDescuento(producto_id, cantidad_minima, porcentaje_descuento) {
  const descuentos = loadDescuentos();
  
  // Verificar si ya existe un descuento con los mismos parámetros
  const existeIndex = descuentos.findIndex(d => 
    d.producto_id === Number(producto_id) && 
    d.cantidad_minima === Number(cantidad_minima) &&
    d.activo
  );
  
  if (existeIndex >= 0) {
    // Si existe, actualizar el porcentaje
    descuentos[existeIndex].porcentaje_descuento = Number(porcentaje_descuento);
    descuentos[existeIndex].fecha_actualizacion = new Date().toISOString();
  } else {
    // Crear nuevo descuento
    const newId = descuentos.length > 0 ? Math.max(...descuentos.map(d => d.id)) + 1 : 1;
    const nuevoDescuento = {
      id: newId,
      producto_id: Number(producto_id),
      cantidad_minima: Number(cantidad_minima),
      porcentaje_descuento: Number(porcentaje_descuento),
      activo: true,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString()
    };
    descuentos.push(nuevoDescuento);
  }
  
  saveDescuentos(descuentos);
  return true;
}

/**
 * Actualiza un descuento existente
 * @param {number} id - ID del descuento
 * @param {number} producto_id - ID del producto
 * @param {number} cantidad_minima - Cantidad mínima para aplicar el descuento
 * @param {number} porcentaje_descuento - Porcentaje de descuento
 * @param {boolean} activo - Estado del descuento
 * @returns {boolean} Éxito de la operación
 */
function actualizarDescuento(id, producto_id, cantidad_minima, porcentaje_descuento, activo = true) {
  const descuentos = loadDescuentos();
  const index = descuentos.findIndex(d => d.id === Number(id));
  
  if (index >= 0) {
    // Verificar si existe otro descuento con los mismos parámetros (excluyendo el actual)
    const duplicado = descuentos.findIndex(d => 
      d.id !== Number(id) &&
      d.producto_id === Number(producto_id) && 
      d.cantidad_minima === Number(cantidad_minima) &&
      d.activo
    );
    
    if (duplicado >= 0) {
      console.warn('Ya existe un descuento activo con los mismos parámetros');
      return false;
    }
    
    // Actualizar el descuento
    descuentos[index] = {
      ...descuentos[index],
      producto_id: Number(producto_id),
      cantidad_minima: Number(cantidad_minima),
      porcentaje_descuento: Number(porcentaje_descuento),
      activo: Boolean(activo),
      fecha_actualizacion: new Date().toISOString()
    };
    
    saveDescuentos(descuentos);
    return true;
  }
  
  return false;
}

/**
 * Elimina un descuento (marca como inactivo)
 * @param {number} id - ID del descuento
 * @returns {boolean} Éxito de la operación
 */
function eliminarDescuento(id) {
  const descuentos = loadDescuentos();
  const index = descuentos.findIndex(d => d.id === Number(id));
  
  if (index >= 0) {
    descuentos[index].activo = false;
    descuentos[index].fecha_actualizacion = new Date().toISOString();
    saveDescuentos(descuentos);
    return true;
  }
  
  return false;
}

/**
 * Elimina permanentemente un descuento del archivo
 * @param {number} id - ID del descuento
 * @returns {boolean} Éxito de la operación
 */
function eliminarDescuentoPermanente(id) {
  const descuentos = loadDescuentos();
  const index = descuentos.findIndex(d => d.id === Number(id));
  
  if (index >= 0) {
    descuentos.splice(index, 1);
    saveDescuentos(descuentos);
    return true;
  }
  
  return false;
}

/**
 * Obtiene todos los descuentos (activos e inactivos)
 * @returns {Array} Array de todos los descuentos
 */
function getAllDescuentos() {
  return loadDescuentos();
}

/**
 * Obtiene solo los descuentos activos
 * @returns {Array} Array de descuentos activos
 */
function getDescuentosActivos() {
  const descuentos = loadDescuentos();
  return descuentos.filter(d => d.activo);
}

/**
 * Obtiene un descuento por su ID
 * @param {number} id - ID del descuento
 * @returns {Object|null} Descuento encontrado o null
 */
function getDescuentoById(id) {
  const descuentos = loadDescuentos();
  return descuentos.find(d => d.id === Number(id)) || null;
}

/**
 * Reactiva un descuento inactivo
 * @param {number} id - ID del descuento
 * @returns {boolean} Éxito de la operación
 */
function reactivarDescuento(id) {
  const descuentos = loadDescuentos();
  const index = descuentos.findIndex(d => d.id === Number(id));
  
  if (index >= 0) {
    descuentos[index].activo = true;
    descuentos[index].fecha_actualizacion = new Date().toISOString();
    saveDescuentos(descuentos);
    return true;
  }
  
  return false;
}

// === Exportaciones ===
module.exports = {
  // Funciones principales de CRUD
  calcularDescuentoPorCantidad,
  getDescuentosProducto,
  crearDescuento,
  actualizarDescuento,
  eliminarDescuento,
  getAllDescuentos,
  
  // Funciones adicionales
  getDescuentosActivos,
  getDescuentoById,
  eliminarDescuentoPermanente,
  reactivarDescuento,
  
  // Utilidades (para testing o uso avanzado)
  loadDescuentos,
  saveDescuentos
};