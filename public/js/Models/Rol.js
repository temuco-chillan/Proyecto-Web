const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const Rol = sequelize.define('Rol', {
  nombre: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false
  }
}, {
  tableName: 'roles',
  timestamps: false
});

module.exports = Rol;
