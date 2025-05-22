const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'usuarios.json');

function loadUsers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

async function getUsers() {
  return loadUsers();
}

async function getUserById(id) {
  const users = loadUsers();
  return users.find(u => u.id === parseInt(id, 10)) || null;
}

async function createUser({ username, password }) {
  const users = loadUsers();

  if (users.find(u => u.username === username)) {
    throw new Error('EXISTS');
  }

  const newUser = {
    id: users.length ? users[users.length - 1].id + 1 : 1,
    username,
    password
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

async function validateUser({ username, password }) {
  const users = loadUsers();
  return users.find(u => u.username === username && u.password === password) || null;
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  validateUser
};