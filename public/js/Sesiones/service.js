const { Usuario, Rol } = require('../Models');
const jsonFallback = require('./json');

let useFallback = false;

// Verifica conexión a base de datos
async function isConnected() {
  try {
    await Usuario.sequelize.authenticate();
    return true;
  } catch {
    return false;
  }
}

// === FUNCIONES ===

async function getUsers() {
  if (useFallback) return jsonFallback.getUsers();
  try {
    return await Usuario.findAll({ include: Rol });
  } catch (err) {
    console.error('Error al obtener usuarios:', err.message);
    throw err;
  }
}


async function getUserById(id) {
  if (useFallback) return jsonFallback.getUserById(id);
  return await Usuario.findByPk(id, { include: Rol });
}

async function createUser({ username, email, password, rol_id }) {
  if (useFallback) return jsonFallback.createUser({ username, email, password, id_rol: rol_id });

  // Verificar si el username ya existe
  const existingUser = await Usuario.findOne({ where: { username } });
  if (existingUser) throw new Error('USERNAME_EXISTS');

  // Verificar si el email ya existe
  const existingEmail = await Usuario.findOne({ where: { email } });
  if (existingEmail) throw new Error('EMAIL_EXISTS');

  const user = await Usuario.create({ username, email, password, rol_id });
  return user;
}



async function validateUser({ username, password }) {
  if (useFallback) return jsonFallback.validateUser({ username, password });

  try {
    const user = await Usuario.findOne({
      where: { username, password },
      include: Rol
    });

    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      password: user.password,
      rol_id: user.rol_id,
      rol: user.Rol?.nombre || null
    };
  } catch (err) {
    console.error('Error al validar usuario:', err.message);
    throw err;
  }

}

// === Inicializa fallback si DB no está disponible ===
(async () => {
  useFallback = !(await isConnected());
  console.log(useFallback ? '🟡 Fallback JSON activado para Usuarios' : '🟢 DB conectada para Usuarios');
})();

module.exports = {
  getUsers,
  getUserById,
  createUser,
  validateUser
};
