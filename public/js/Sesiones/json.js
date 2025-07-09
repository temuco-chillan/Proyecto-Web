const fs = require('fs');
const path = require('path');
const { Usuario } = require('../Models'); // Asegúrate de que la ruta sea correcta

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

// === Generador dinámico de usuario basado en el modelo Sequelize ===

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

  if (!user.creado_en) {
    user.creado_en = new Date().toISOString();
  }

  return user;
}


// === Funciones principales ===

async function getUsers() {
  return loadUsers();
}

async function getUserById(id) {
  const users = loadUsers();
  return users.find(u => u.id === parseInt(id, 10)) || null;
}

async function createUser({ username, email, password, rol_id }) {
  const users = loadUsers();

  if (users.find(u => u.username === username)) {
    throw new Error('USERNAME_EXISTS');
  }

  if (users.find(u => u.email === email)) {
    throw new Error('EMAIL_EXISTS');
  }

  const newUser = generateDefaultUserData({ username, email, password, rol_id });
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

async function validateUser({ username, password }) {
  const users = loadUsers();
  const roles = loadRoles();

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;

  const rol = roles.find(r => r.id === user.rol_id);
  return {
    ...user,
    rol: rol ? rol.nombre : null
  };
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  validateUser
};
