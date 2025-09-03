const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const encryptionService = require('../Utils/encryption');

const Usuario = sequelize.define('Usuario', {
  username: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false
  },
  nombreCompleto: {   // 👈 AGREGA ESTE CAMPO
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // RUT encriptado para seguridad
  rut: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    // Este campo mantiene el RUT encriptado de forma reversible
  },
  telefono: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      isNumeric: {
        msg: 'El teléfono debe contener solo números'
      },
      len: {
        args: [8, 15],
        msg: 'El teléfono debe tener entre 8 y 15 dígitos'
      }
    }
  },
  direccion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: false
  }, 
  rol_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo'
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  hooks: {
    // Hook para encriptar contraseña antes de crear
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2b$')) {
        user.password = await encryptionService.hashPassword(user.password);
      }
      // Activar encriptación reversible del RUT
      if (user.rut && !user.rut.includes(':')) {
        user.rut = await encryptionService.hashRut(user.rut);
      }
    },
    // Hook para encriptar contraseña antes de actualizar
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2b$')) {
        user.password = await encryptionService.hashPassword(user.password);
      }
      // Activar encriptación reversible del RUT
      if (user.changed('rut') && !user.rut.includes(':')) {
        user.rut = await encryptionService.hashRut(user.rut);
      }
    }
  }
});

// Método de instancia para verificar contraseña
Usuario.prototype.verifyPassword = async function(password) {
  return await encryptionService.verifyPassword(password, this.password);
};

// Método de instancia para verificar RUT
Usuario.prototype.verifyRut = async function(rut) {
  return await encryptionService.verifyRut(rut, this.rut);
};

module.exports = Usuario;
