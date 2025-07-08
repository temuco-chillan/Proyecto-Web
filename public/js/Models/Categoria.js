const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const Categoria = sequelize.define('Categoria', {
  nombre: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  }
}, {
  tableName: 'categorias',
  timestamps: false
});

module.exports = Categoria;
