const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const Carrito = sequelize.define('Carrito', {
  cantidad: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  }
}, {
  tableName: 'carrito',
  timestamps: true,
  createdAt: 'fecha_add',
  updatedAt: false
});

module.exports = Carrito;
