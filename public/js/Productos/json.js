const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'computadores.json');

// Estados válidos igual que en la base de datos
const ESTADOS_VALIDOS = ['activo', 'inactivo', 'mantenimiento'];

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getComputadores() {
    return Promise.resolve(readData());
}

function getComputadorById(id) {
    const data = readData();
    const computador = data.find(c => c.id === Number(id));
    return Promise.resolve(computador || null);
}

function insertComputador(computador) {
    //Validar estado
    if (!ESTADOS_VALIDOS.includes(computador.estado)) {
        return Promise.reject(new Error('Estado inválido'));
    }

    const data = readData();
    const newId = data.length > 0 ? Math.max(...data.map(c => c.id)) + 1 : 1;
    computador.id = newId;

    //Añadir fecha de creación
    computador.fecha_add = new Date().toISOString();

    data.push(computador);
    writeData(data);
    return Promise.resolve(newId);
}

function updateComputador(id, computador) {
    const data = readData();
    const index = data.findIndex(c => c.id === Number(id));
    if (index === -1) return Promise.reject(new Error('No encontrado'));

    //Validar estado
    if (!ESTADOS_VALIDOS.includes(computador.estado)) {
        return Promise.reject(new Error('Estado inválido'));
    }

    computador.id = Number(id);

    //Mantener la fecha original si existe
    computador.fecha_add = data[index].fecha_add || new Date().toISOString();

    data[index] = computador;
    writeData(data);
    return Promise.resolve();
}

function deleteComputador(id) {
    const data = readData();
    const index = data.findIndex(c => c.id === Number(id));
    if (index === -1) return Promise.reject(new Error('No encontrado'));

    data.splice(index, 1);
    writeData(data);
    return Promise.resolve();
}

module.exports = {
    getComputadores,
    getComputadorById,
    insertComputador,
    updateComputador,
    deleteComputador
};
