// categorias/json.js
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'Categorias.json');

// Asegura que el archivo existe y retorna su contenido
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Lectura síncrona
function getCategoriasSync() {
  return readData(); // usa la misma lógica que readData
}

// Escritura
function writeCategorias(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Exporta todo correctamente
module.exports = {
  getCategorias: () => Promise.resolve(getCategoriasSync()),
  getCategoriasSync,
  writeCategorias
};
