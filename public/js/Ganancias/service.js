const fs = require('fs');
const path = require('path');

const GANANCIAS_FILE = path.join(__dirname, 'ganancias.json');

// Leer archivo de ganancias
function leerGanancias() {
    try {
        if (!fs.existsSync(GANANCIAS_FILE)) {
            const datosIniciales = {
                total_acumulado: 0,
                porcentaje_ganancia: 15,
                historial_ganancias: []
            };
            fs.writeFileSync(GANANCIAS_FILE, JSON.stringify(datosIniciales, null, 2));
            return datosIniciales;
        }
        const data = fs.readFileSync(GANANCIAS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer ganancias:', error);
        return {
            total_acumulado: 0,
            porcentaje_ganancia: 15,
            historial_ganancias: []
        };
    }
}

// Guardar ganancias
function guardarGanancias(datos) {
    try {
        fs.writeFileSync(GANANCIAS_FILE, JSON.stringify(datos, null, 2));
    } catch (error) {
        console.error('Error al guardar ganancias:', error);
    }
}

// Agregar ganancia de una venta
function agregarGanancia(totalVenta, paymentId, usuarioId) {
    try {
        const datos = leerGanancias();
        
        // Calcular ganancia basada en el porcentaje
        const gananciaVenta = (totalVenta * datos.porcentaje_ganancia) / 100;
        
        // Actualizar total acumulado
        datos.total_acumulado += gananciaVenta;
        
        // Agregar al historial
        const registroGanancia = {
            id: datos.historial_ganancias.length + 1,
            fecha: new Date().toISOString(),
            total_venta: totalVenta,
            porcentaje_aplicado: datos.porcentaje_ganancia,
            ganancia_calculada: gananciaVenta,
            payment_id: paymentId,
            usuario_id: usuarioId,
            total_acumulado_despues: datos.total_acumulado
        };
        
        datos.historial_ganancias.push(registroGanancia);
        
        // Guardar cambios
        guardarGanancias(datos);
        
        console.log(`💰 Ganancia agregada: $${gananciaVenta.toFixed(2)} (${datos.porcentaje_ganancia}% de $${totalVenta})`);
        console.log(`💰 Total acumulado: $${datos.total_acumulado.toFixed(2)}`);
        
        return registroGanancia;
    } catch (error) {
        console.error('Error al agregar ganancia:', error);
        return null;
    }
}

// Obtener ganancias totales
function obtenerGanancias() {
    return leerGanancias();
}

// Actualizar porcentaje de ganancia
function actualizarPorcentaje(nuevoPorcentaje) {
    try {
        const datos = leerGanancias();
        datos.porcentaje_ganancia = nuevoPorcentaje;
        guardarGanancias(datos);
        return true;
    } catch (error) {
        console.error('Error al actualizar porcentaje:', error);
        return false;
    }
}

module.exports = {
    agregarGanancia,
    obtenerGanancias,
    actualizarPorcentaje
};