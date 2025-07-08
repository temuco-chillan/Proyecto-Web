const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class Producto extends Model {
  toSimpleJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      precio: this.precio,
      descuento: this.descuento,
      stock: this.stock,
      imagen_url: this.imagen_url
    };
  }

  static fromJSON(json) {
    return Producto.build({
      nombre: json.nombre,
      descripcion: json.descripcion,
      precio: json.precio,
      descuento: json.descuento || 0,
      stock: json.stock || 0,
      imagen_url: json.imagen_url
    });
  }
}

Producto.init({
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  descripcion: DataTypes.TEXT,
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  descuento: { type: DataTypes.INTEGER, defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  imagen_url: DataTypes.STRING,
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'mantenimiento'),
    defaultValue: 'activo'
  }
}, {
  sequelize,
  modelName: 'Producto',
  tableName: 'productos',
  timestamps: true,
  createdAt: 'fecha_add',
  updatedAt: false
});

module.exports = Producto;
