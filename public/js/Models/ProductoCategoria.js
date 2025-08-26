const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const ProductoCategoria = sequelize.define('producto_categorias', {
  producto_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    primaryKey: true
  }
}, {
  timestamps: false,
  tableName: 'producto_categorias'
});

module.exports = ProductoCategoria;
