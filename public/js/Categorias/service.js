// categorias/service.js
const { Categoria } = require('../Models');
const jsonFallback = require('./json');

let useFallback = false;

async function isConnected() {
  try {
    await Categoria.sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}

async function getCategorias() {
  if (useFallback) return jsonFallback.getCategorias();
  return await Categoria.findAll();
}

// Inicializa conexión al iniciar
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Categorías' : '🟢 DB conectada para Categorías');
})();
async function insertCategoria(nombre) {
  if (useFallback) {
    const data = jsonFallback.getCategoriasSync(); // método síncrono auxiliar
    const id = data.length ? Math.max(...data.map(c => c.id)) + 1 : 1;
    const nueva = { id, nombre };
    data.push(nueva);
    jsonFallback.writeCategorias(data);
    return nueva;
  }

  const nueva = await Categoria.create({ nombre });
  return nueva.toJSON();
}

module.exports = {
  getCategorias,
  insertCategoria
};
