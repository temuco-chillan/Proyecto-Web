const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'computadores.json');

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
    const data = readData();
    const newId = data.length > 0 ? Math.max(...data.map(c => c.id)) + 1 : 1;
    computador.id = newId;
    data.push(computador);
    writeData(data);
    return Promise.resolve(newId);
}

function updateComputador(id, computador) {
    const data = readData();
    const index = data.findIndex(c => c.id === Number(id));
    if (index === -1) return Promise.reject(new Error('No encontrado'));
    computador.id = Number(id);
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