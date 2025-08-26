const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class DetalleVenta extends Model {
  toSimpleJSON() {
    return {
      id: this.id,
      venta_id: this.venta_id,
      producto_id: this.producto_id,
      cantidad: this.cantidad,
      precio_unitario: this.precio_unitario,
      descuento_aplicado: this.descuento_aplicado,
      subtotal: this.subtotal
    };
  }

  static fromJSON(json) {
    return DetalleVenta.build({
      venta_id: json.venta_id,
      producto_id: json.producto_id,
      cantidad: json.cantidad,
      precio_unitario: json.precio_unitario,
      descuento_aplicado: json.descuento_aplicado || 0,
      subtotal: json.subtotal
    });
  }
}

DetalleVenta.init({
  venta_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ventas',
      key: 'id'
    }
  },
  producto_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'id'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  descuento_aplicado: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'DetalleVenta',
  tableName: 'detalle_venta',
  timestamps: false
});

module.exports = DetalleVenta;