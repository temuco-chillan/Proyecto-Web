const { DataTypes, Model } = require('sequelize');
const sequelize = require('../Config/database');

class Venta extends Model {
  toSimpleJSON() {
    return {
      id: this.id,
      usuario_id: this.usuario_id,
      fecha_venta: this.fecha_venta,
      total: this.total,
      payment_id: this.payment_id,
      estado: this.estado
    };
  }

  static fromJSON(json) {
    return Venta.build({
      usuario_id: json.usuario_id,
      total: json.total,
      payment_id: json.payment_id,
      estado: json.estado || 'pendiente'
    });
  }
}

Venta.init({
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  fecha_venta: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('completada', 'cancelada', 'pendiente'),
    defaultValue: 'pendiente'
  }
}, {
  sequelize,
  modelName: 'Venta',
  tableName: 'ventas',
  timestamps: true,
  createdAt: 'fecha_venta',
  updatedAt: false
});

module.exports = Venta;