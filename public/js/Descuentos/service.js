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
     * Obtiene todos los descuentos
     * @returns {Promise<Array>} - Lista de todos los descuentos
     */
    static async getAllDescuentos() {
        if (useFallback) {
            return jsonFallback.getAllDescuentos();
        }
        
        try {
            const query = `
                SELECT * FROM descuentos_cantidad 
                ORDER BY producto_id ASC, cantidad_minima ASC
            `;
            
            const result = await sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT
            });
            
            return result;
        } catch (error) {
            console.error('Error al obtener todos los descuentos:', error);
            // Fallback automático en caso de error
            return jsonFallback.getAllDescuentos();
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

    /**
     * Elimina un descuento por ID
     * @param {number} id - ID del descuento
     * @returns {Promise<boolean>} - Éxito de la operación
     */
    static async eliminarDescuento(id) {
        if (useFallback) {
            return jsonFallback.eliminarDescuentoPermanente(id);
        }
        
        try {
            const query = `
                DELETE FROM descuentos_cantidad 
                WHERE id = :id
            `;
            
            const result = await sequelize.query(query, {
                replacements: { id },
                type: sequelize.QueryTypes.DELETE
            });
            
            return result[1] > 0; // result[1] contiene el número de filas afectadas
        } catch (error) {
            console.error('Error al eliminar descuento:', error);
            // Fallback automático en caso de error
            return jsonFallback.eliminarDescuento(id);
        }
    }

    /**
     * Actualiza un descuento existente
     * @param {number} id - ID del descuento
     * @param {number} producto_id - ID del producto
     * @param {number} cantidad_minima - Cantidad mínima para el descuento
     * @param {number} porcentaje_descuento - Porcentaje de descuento
     * @param {boolean} activo - Estado del descuento
     * @returns {Promise<boolean>} - Éxito de la operación
     */
    static async actualizarDescuento(id, producto_id, cantidad_minima, porcentaje_descuento, activo = true) {
        if (useFallback) {
            return jsonFallback.actualizarDescuento(id, producto_id, cantidad_minima, porcentaje_descuento, activo);
        }
        
        try {
            const query = `
                UPDATE descuentos_cantidad 
                SET producto_id = :producto_id,
                    cantidad_minima = :cantidad_minima,
                    porcentaje_descuento = :porcentaje_descuento,
                    activo = :activo
                WHERE id = :id
            `;
            
            const result = await sequelize.query(query, {
                replacements: { 
                    id, 
                    producto_id, 
                    cantidad_minima, 
                    porcentaje_descuento, 
                    activo: activo ? 1 : 0 
                },
                type: sequelize.QueryTypes.UPDATE
            });
            
            return result[1] > 0; // result[1] contiene el número de filas afectadas
        } catch (error) {
            console.error('Error al actualizar descuento:', error);
            // Fallback automático en caso de error
            return jsonFallback.actualizarDescuento(id, producto_id, cantidad_minima, porcentaje_descuento, activo);
        }
    }
}

// === Inicialización del fallback ===
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Descuentos' : '🟢 DB conectada para Descuentos');
})();

module.exports = DescuentosService;