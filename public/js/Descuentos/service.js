const { sequelize } = require('../Models');
const jsonFallback = require('./json');

let useFallback = false;

// Verifica conexión a la base de datos
async function isConnected() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('Base de datos no disponible:', error.message);
    return false;
  }
}

class DescuentosService {
    /**
     * Calcula el descuento por cantidad para un producto
     * @param {number} producto_id - ID del producto
     * @param {number} cantidad - Cantidad del producto
     * @returns {Promise<number>} - Porcentaje de descuento (0-100)
     */
    static async calcularDescuentoPorCantidad(producto_id, cantidad) {
        if (useFallback) {
            return jsonFallback.calcularDescuentoPorCantidad(producto_id, cantidad);
        }
        
        try {
            const query = `
                SELECT porcentaje_descuento
                FROM descuentos_cantidad 
                WHERE producto_id = :producto_id 
                AND cantidad_minima <= :cantidad 
                ORDER BY cantidad_minima DESC 
                LIMIT 1
            `;
            
            const result = await sequelize.query(query, {
                replacements: { producto_id, cantidad },
                type: sequelize.QueryTypes.SELECT
            });
            
            return result.length > 0 ? result[0].porcentaje_descuento : 0;
        } catch (error) {
            console.error('Error al calcular descuento:', error);
            // Fallback automático en caso de error
            return jsonFallback.calcularDescuentoPorCantidad(producto_id, cantidad);
        }
    }

    /**
     * Obtiene todos los descuentos de un producto
     * @param {number} producto_id - ID del producto
     * @returns {Promise<Array>} - Lista de descuentos
     */
    static async getDescuentosProducto(producto_id) {
        if (useFallback) {
            return jsonFallback.getDescuentosProducto(producto_id);
        }
        
        try {
            const query = `
                SELECT * FROM descuentos_cantidad 
                WHERE producto_id = :producto_id 
                ORDER BY cantidad_minima ASC
            `;
            
            const result = await sequelize.query(query, {
                replacements: { producto_id },
                type: sequelize.QueryTypes.SELECT
            });
            
            return result;
        } catch (error) {
            console.error('Error al obtener descuentos:', error);
            // Fallback automático en caso de error
            return jsonFallback.getDescuentosProducto(producto_id);
        }
    }

    /**
     * Crea o actualiza un descuento por cantidad
     * @param {number} producto_id - ID del producto
     * @param {number} cantidad_minima - Cantidad mínima para el descuento
     * @param {number} porcentaje_descuento - Porcentaje de descuento
     * @returns {Promise<boolean>} - Éxito de la operación
     */
    static async crearDescuento(producto_id, cantidad_minima, porcentaje_descuento) {
        if (useFallback) {
            return jsonFallback.crearDescuento(producto_id, cantidad_minima, porcentaje_descuento);
        }
        
        try {
            const query = `
                INSERT INTO descuentos_cantidad (producto_id, cantidad_minima, porcentaje_descuento)
                VALUES (:producto_id, :cantidad_minima, :porcentaje_descuento)
                ON DUPLICATE KEY UPDATE 
                porcentaje_descuento = :porcentaje_descuento
            `;
            
            await sequelize.query(query, {
                replacements: { producto_id, cantidad_minima, porcentaje_descuento },
                type: sequelize.QueryTypes.INSERT
            });
            
            return true;
        } catch (error) {
            console.error('Error al crear descuento:', error);
            // Fallback automático en caso de error
            return jsonFallback.crearDescuento(producto_id, cantidad_minima, porcentaje_descuento);
        }
    }
}

// === Inicialización del fallback ===
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Descuentos' : '🟢 DB conectada para Descuentos');
})();

module.exports = DescuentosService;