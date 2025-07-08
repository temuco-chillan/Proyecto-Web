const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const ProductoCategoria = sequelize.define('ProductoCategoria', {
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  categoria_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'producto_categorias',
  timestamps: false
});

module.exports = ProductoCategoria;
