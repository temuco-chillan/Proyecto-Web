const sequelize = require('../Config/database');
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Categoria = require('./Categoria');
const ProductoCategoria = require('./ProductoCategoria');
const Carrito = require('./Carrito');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');

// Relaciones con alias específicos
Rol.hasMany(Usuario, { foreignKey: 'rol_id', as: 'usuarios' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id', as: 'rol' });

Producto.belongsToMany(Categoria, {
  through: ProductoCategoria,
  as: 'Categorias',
  foreignKey: 'producto_id',
  otherKey: 'categoria_id'
});

Categoria.belongsToMany(Producto, {
  through: ProductoCategoria,
  as: 'Productos',
  foreignKey: 'categoria_id',
  otherKey: 'producto_id'
});

Usuario.hasMany(Carrito, { foreignKey: 'usuario_id' });
Carrito.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Producto.hasMany(Carrito, { foreignKey: 'producto_id' });
Carrito.belongsTo(Producto, { foreignKey: 'producto_id' });

// Definir relaciones para Venta y DetalleVenta con aliases explícitos
Venta.hasMany(DetalleVenta, { 
  foreignKey: 'venta_id',
  as: 'detalles'  // Alias explícito
});
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });

DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id' });

// ✅ CORREGIR: Agregar relación bidireccional entre Usuario y Venta
Usuario.hasMany(Venta, { foreignKey: 'usuario_id' });
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id' });

module.exports = {
  sequelize,
  Rol,
  Usuario,
  Producto,
  Categoria,
  ProductoCategoria,
  Carrito,
  Venta,
  DetalleVenta
};
