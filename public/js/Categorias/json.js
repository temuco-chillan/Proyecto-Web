// categorias/json.js
const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'Categorias.json');

// Asegura que el archivo existe
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
function getCategoriasSync() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeCategorias(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  getCategorias: () => Promise.resolve(getCategoriasSync()),
  getCategoriasSync,
  writeCategorias
};

module.exports = {
  getCategorias: () => Promise.resolve(readData())
};
