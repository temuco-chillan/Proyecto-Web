const sequelize = require('../config/database');
const Rol = require('./Rol');
const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Categoria = require('./Categoria');
const ProductoCategoria = require('./ProductoCategoria');
const Carrito = require('./Carrito');

// Relaciones
Rol.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Rol, { foreignKey: 'rol_id' });

Producto.belongsToMany(Categoria, {
  through: ProductoCategoria,
  foreignKey: 'producto_id'
});
Categoria.belongsToMany(Producto, {
  through: ProductoCategoria,
  foreignKey: 'categoria_id'
});

Usuario.hasMany(Carrito, { foreignKey: 'usuario_id' });
Carrito.belongsTo(Usuario, { foreignKey: 'usuario_id' });

Producto.hasMany(Carrito, { foreignKey: 'producto_id' });
Carrito.belongsTo(Producto, { foreignKey: 'producto_id' });

module.exports = {
  sequelize,
  Rol,
  Usuario,
  Producto,
  Categoria,
  ProductoCategoria,
  Carrito
};
