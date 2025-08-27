const fs = require('fs');
const path = require('path');
const { Usuario } = require('../Models');
const encryptionService = require('../Utils/encryption');

const USERS_FILE = path.join(__dirname, 'usuarios.json');
const ROLES_FILE = path.join(__dirname, 'roles.json');

// === Utilidades JSON ===

function loadJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadUsers() {
  return loadJSON(USERS_FILE);
}

function loadRoles() {
  return loadJSON(ROLES_FILE);
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// === Generador dinámico de usuario actualizado ===

function generateDefaultUserData(data = {}) {
  const fields = Usuario.rawAttributes;
  const users = loadUsers();

  const user = {};

  for (const fieldName in fields) {
    const field = fields[fieldName];

    if (data[fieldName] !== undefined) {
      user[fieldName] = data[fieldName];
      continue;
    }

    if (fieldName === 'id') {
      user.id = users.length ? users[users.length - 1].id + 1 : 1;
    } else if (fieldName === 'rol_id') {
      user.rol_id = 2; // Valor por defecto para usuarios comunes
    } else if (field.defaultValue !== undefined) {
      user[fieldName] = typeof field.defaultValue === 'function'
        ? field.defaultValue()
        : field.defaultValue;
    } else if (field.allowNull) {
      user[fieldName] = null;
    }
  }

  // Campos específicos con valores por defecto
  if (!user.creado_en) {
    user.creado_en = new Date().toISOString();
  }
  
  // Asegurar que los nuevos campos estén incluidos
  if (user.rut === undefined) user.rut = null;
  if (user.telefono === undefined) user.telefono = null;
  if (user.direccion === undefined) user.direccion = null;
  if (user.ciudad === undefined) user.ciudad = null;
  if (user.region === undefined) user.region = null;
  
  return user;
}

// === Funciones principales actualizadas ===

async function getUsers() {
  const users = loadUsers();
  // Excluir datos sensibles
  return users.map(user => {
    const { password, rut, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
  });
}

async function getUserById(id) {
  const users = loadUsers();
  const user = users.find(u => u.id === parseInt(id, 10));
  if (!user) return null;
  
  // Excluir datos sensibles
  const { password, rut, ...userWithoutSensitiveData } = user;
  return userWithoutSensitiveData;
}

async function createUser({ username, email, password, rol_id, rut, telefono, direccion, ciudad, region }) {
  const users = loadUsers();

  if (users.find(u => u.username === username)) {
    throw new Error('USERNAME_EXISTS');
  }

  if (users.find(u => u.email === email)) {
    throw new Error('EMAIL_EXISTS');
  }
  
  // Validar formato de RUT
  if (rut && !encryptionService.validateRut(rut)) {
    throw new Error('RUT_INVALID_FORMAT');
  }
  
  // Verificar RUT duplicado
  if (rut) {
    for (const user of users) {
      if (user.rut && await encryptionService.verifyRut(rut, user.rut)) {
        throw new Error('RUT_EXISTS');
      }
    }
  }

  // Encriptar contraseña y RUT
  const hashedPassword = await encryptionService.hashPassword(password);
  const hashedRut = rut ? await encryptionService.hashRut(rut) : null;

  const newUser = generateDefaultUserData({ 
    username, 
    email, 
    password: hashedPassword, 
    rol_id,
    rut: hashedRut,
    telefono,
    direccion,
    ciudad,
    region
  });
  
  users.push(newUser);
  saveUsers(users);
  
  // Retornar usuario sin datos sensibles
  const { password: _, rut: __, ...userWithoutSensitiveData } = newUser;
  return userWithoutSensitiveData;
}

async function updateUser(id, updates) {
  const users = loadUsers();
  const userIndex = users.findIndex(u => u.id === parseInt(id, 10));
  
  if (userIndex === -1) {
    throw new Error('USER_NOT_FOUND');
  }

  // Validar RUT si se está actualizando
  if (updates.rut && !encryptionService.validateRut(updates.rut)) {
    throw new Error('RUT_INVALID_FORMAT');
  }

  // Verificar RUT duplicado si se está actualizando
  if (updates.rut) {
    for (let i = 0; i < users.length; i++) {
      if (i !== userIndex && users[i].rut && await encryptionService.verifyRut(updates.rut, users[i].rut)) {
        throw new Error('RUT_EXISTS');
      }
    }
  }

  // Encriptar nuevos datos si es necesario
  if (updates.password && !updates.password.startsWith('$2b$')) {
    updates.password = await encryptionService.hashPassword(updates.password);
  }
  if (updates.rut && !updates.rut.startsWith('$2b$')) {
    updates.rut = await encryptionService.hashRut(updates.rut);
  }

  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  
  // Retornar usuario sin datos sensibles
  const { password, rut, ...userWithoutSensitiveData } = users[userIndex];
  return userWithoutSensitiveData;
}

async function validateUser({ username, password }) {
  const users = loadUsers();
  const roles = loadRoles();

  const user = users.find(u => u.username === username);
  if (!user) return null;

  // Verificar contraseña encriptada
  const isValidPassword = await encryptionService.verifyPassword(password, user.password);
  if (!isValidPassword) return null;

  const rol = roles.find(r => r.id === user.rol_id);
  
  // Retornar usuario sin datos sensibles
  const { password: _, rut, ...userWithoutSensitiveData } = user;
  return {
    ...userWithoutSensitiveData,
    rol: rol ? rol.nombre : 'usuario'
  };
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  validateUser
};
