const { Usuario, Rol } = require('../Models');
const jsonFallback = require('./json');
const encryptionService = require('../Utils/encryption');
let useFallback = false;

// Verifica conexión a la base de datos
async function isConnected() {
  try {
    await Usuario.sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
}

// === CRUD de Usuarios ===

async function getUsers() {
  if (useFallback) {
    return await jsonFallback.getUsers();
  }
  
  try {
    const users = await Usuario.findAll({
      include: [{ model: Rol, as: 'rol' }]
    });
    
    // Excluir datos sensibles
    return users.map(user => {
      const { password, rut, ...userWithoutSensitiveData } = user.toJSON();
      return {
        ...userWithoutSensitiveData,
        rol: user.rol ? user.rol.nombre : 'usuario'
      };
    });
  } catch (error) {
    console.error('Error al obtener usuarios, usando fallback:', error);
    return await jsonFallback.getUsers();
  }
}

async function getUserById(id) {
  if (useFallback) {
    return await jsonFallback.getUserById(id);
  }
  
  try {
    const user = await Usuario.findByPk(id, {
      include: [{ model: Rol, as: 'rol' }]
    });
    
    if (!user) return null;
    
    // Excluir datos sensibles
    const { password, rut, ...userWithoutSensitiveData } = user.toJSON();
    return {
      ...userWithoutSensitiveData,
      rol: user.rol ? user.rol.nombre : 'usuario'
    };
  } catch (error) {
    console.error('Error al obtener usuario, usando fallback:', error);
    return await jsonFallback.getUserById(id);
  }
}

async function createUser(userData) {
  if (useFallback) {
    return await jsonFallback.createUser(userData);
  }
  
  try {
    // Validar RUT único
    if (userData.rut) {
      const existingUser = await Usuario.findOne({ where: { rut: userData.rut } });
      if (existingUser) {
        throw new Error('El RUT ya está registrado');
      }
    }
    
    const user = await Usuario.create(userData);
    
    // Excluir datos sensibles
    const { password, rut, ...userWithoutSensitiveData } = user.toJSON();
    return userWithoutSensitiveData;
  } catch (error) {
    console.error('Error al crear usuario, usando fallback:', error);
    return await jsonFallback.createUser(userData);
  }
}

async function updateUser(id, userData) {
  if (useFallback) {
    return await jsonFallback.updateUser(id, userData);
  }
  
  try {
    // Validar RUT único si se está actualizando
    if (userData.rut) {
      const existingUser = await Usuario.findOne({ 
        where: { 
          rut: userData.rut,
          id: { [Usuario.sequelize.Op.ne]: id }
        } 
      });
      if (existingUser) {
        throw new Error('El RUT ya está registrado por otro usuario');
      }
    }
    
    const [updatedRows] = await Usuario.update(userData, {
      where: { id }
    });
    
    return updatedRows > 0;
  } catch (error) {
    console.error('Error al actualizar usuario, usando fallback:', error);
    return await jsonFallback.updateUser(id, userData);
  }
}

async function validateUser({ username, password }) {
  if (useFallback) {
    return await jsonFallback.validateUser({ username, password });
  }
  
  try {
    const user = await Usuario.findOne({ 
      where: { username },
      include: [{ model: Rol, as: 'rol' }]
    });
    
    if (!user) {
      return null;
    }

    // Verificar contraseña usando el método de encriptación
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return null;
    }

    // Retornar usuario sin datos sensibles
    const { password: _, rut, ...userWithoutSensitiveData } = user.toJSON();
    return {
      ...userWithoutSensitiveData,
      rol: user.rol ? user.rol.nombre : 'usuario'
    };
    
  } catch (error) {
    console.error('Error al validar usuario, usando fallback:', error);
    return await jsonFallback.validateUser({ username, password });
  }
}

// Inicializar el estado del fallback al cargar el módulo
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Sesiones' : '🟢 DB conectada para Sesiones');
})();

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  validateUser
};
