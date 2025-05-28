const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'usuarios.json');
const ROLES_FILE = path.join(__dirname, 'roles.json');

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

async function getUsers() {
  return loadUsers();
}

async function getUserById(id) {
  const users = loadUsers();
  return users.find(u => u.id === parseInt(id, 10)) || null;
}

async function createUser({ username, password, id_rol }) {
  const users = loadUsers();

  if (users.find(u => u.username === username)) {
    throw new Error('EXISTS');
  }

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    username,
    password,
    id_rol
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

async function validateUser({ username, password }) {
  const users = loadUsers();
  const roles = loadRoles();

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;

  const rol = roles.find(r => r.id === user.id_rol);
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
