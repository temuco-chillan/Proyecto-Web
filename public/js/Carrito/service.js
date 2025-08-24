const { sequelize } = require('../Models');
const DescuentosService = require('../Descuentos/service');
const jsonFallback = require('./json');

// ✅ INICIALIZAR useFallback UNA SOLA VEZ
let useFallback = false;

// Verificar conexión al inicializar el módulo
(async () => {
    try {
        await sequelize.authenticate();
        useFallback = false;
        console.log('✅ Carrito: Conectado a la base de datos');
    } catch (error) {
        useFallback = true;
        console.log('⚠️ Carrito: Usando JSON fallback');
    }
})();

class CarritoService {
    static async getCarrito(usuario_id) {
        if (useFallback) {
            return await jsonFallback.getCarrito(usuario_id);
        }
        
        try {
            const query = `
                SELECT 
                    c.producto_id,
                    c.cantidad,
                    p.nombre,
                    p.precio,
                    p.descuento,
                    p.imagen_url,
                    p.video_url,
                    p.stock
                FROM carrito c
                INNER JOIN productos p ON c.producto_id = p.id
                WHERE c.usuario_id = :usuario_id
                AND p.estado = 'activo'
            `;
            
            const items = await sequelize.query(query, {
                replacements: { usuario_id },
                type: sequelize.QueryTypes.SELECT
            });
            
            // Aplicar descuentos (individuales + por cantidad)
            for (let item of items) {
                const precio_original = parseFloat(item.precio);
                let precio_final = precio_original;
                let descuento_total = 0;
                
                // 1. Aplicar descuento individual del producto
                const descuento_individual = parseFloat(item.descuento) || 0;
                if (descuento_individual > 0) {
                    precio_final = precio_final * (1 - descuento_individual / 100);
                    descuento_total += descuento_individual;
                }
                
                // 2. Aplicar descuento por cantidad SOBRE EL PRECIO YA DESCONTADO
                const descuento_cantidad = await DescuentosService.calcularDescuentoPorCantidad(
                    item.producto_id, 
                    item.cantidad
                );
                
                if (descuento_cantidad > 0) {
                    // Aplicar descuento por cantidad sobre el precio ya descontado
                    precio_final = precio_final * (1 - descuento_cantidad / 100);
                    // Calcular el descuento total efectivo
                    descuento_total = ((precio_original - precio_final) / precio_original) * 100;
                }
                
                // Actualizar item con descuentos aplicados
                if (descuento_total > 0) {
                    item.precio_original = precio_original;
                    item.precio_con_descuento = precio_final;
                    item.precio = precio_final; // Para compatibilidad
                    item.descuento_aplicado = descuento_total;
                    item.descuento_individual = descuento_individual;
                    item.descuento_cantidad = descuento_cantidad;
                }
            }
            
            return items;
        } catch (error) {
            console.error('Error al obtener carrito:', error);
            // Fallback automático en caso de error
            return await jsonFallback.getCarrito(usuario_id);
        }
    }

    static async agregarAlCarrito(usuario_id, producto_id, cantidad) {
        if (useFallback) {
            return await jsonFallback.agregarAlCarrito(usuario_id, producto_id, cantidad);
        }
        
        try {
            const query = `
                INSERT INTO carrito (usuario_id, producto_id, cantidad)
                VALUES (:usuario_id, :producto_id, :cantidad)
                ON DUPLICATE KEY UPDATE cantidad = cantidad + :cantidad
            `;
            
            await sequelize.query(query, {
                replacements: { usuario_id, producto_id, cantidad },
                type: sequelize.QueryTypes.INSERT
            });
            
            return true;
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            // Fallback automático en caso de error
            return await jsonFallback.agregarAlCarrito(usuario_id, producto_id, cantidad);
        }
    }

    static async actualizarCantidad(usuario_id, producto_id, cantidad) {
        if (useFallback) {
            return await jsonFallback.actualizarCantidadCarrito(usuario_id, producto_id, cantidad);
        }
        
        try {
            const query = `
                UPDATE carrito 
                SET cantidad = :cantidad 
                WHERE usuario_id = :usuario_id AND producto_id = :producto_id
            `;
            
            await sequelize.query(query, {
                replacements: { usuario_id, producto_id, cantidad },
                type: sequelize.QueryTypes.UPDATE
            });
            
            return true;
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
            // Fallback automático en caso de error
            return await jsonFallback.actualizarCantidadCarrito(usuario_id, producto_id, cantidad);
        }
    }

    static async eliminarDelCarrito(usuario_id, producto_id) {
        if (useFallback) {
            return await jsonFallback.eliminarDelCarrito(usuario_id, producto_id);
        }
        
        try {
            const query = `
                DELETE FROM carrito 
                WHERE usuario_id = :usuario_id AND producto_id = :producto_id
            `;
            
            await sequelize.query(query, {
                replacements: { usuario_id, producto_id },
                type: sequelize.QueryTypes.DELETE
            });
            
            return true;
        } catch (error) {
            console.error('Error al eliminar del carrito:', error);
            // Fallback automático en caso de error
            return await jsonFallback.eliminarDelCarrito(usuario_id, producto_id);
        }
    }

    static async vaciarCarrito(usuario_id) {
        if (useFallback) {
            return await jsonFallback.vaciarCarrito(usuario_id);
        }
        
        try {
            const query = `DELETE FROM carrito WHERE usuario_id = :usuario_id`;
            
            await sequelize.query(query, {
                replacements: { usuario_id },
                type: sequelize.QueryTypes.DELETE
            });
            
            return true;
        } catch (error) {
            console.error('Error al vaciar carrito:', error);
            // Fallback automático en caso de error
            return await jsonFallback.vaciarCarrito(usuario_id);
        }
    }
}

module.exports = CarritoService;
