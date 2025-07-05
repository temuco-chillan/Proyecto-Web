const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'Productos.json');

// Estados válidos igual que en la base de datos
const ESTADOS_VALIDOS = ['activo', 'Reposicion', 'fuera-stock'];

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

function getProducto() {
    return Promise.resolve(readData());
}

function getProductoById(id) {
    const data = readData();
    const Producto = data.find(p => p.id === Number(id));
    return Promise.resolve(Producto || null);
}

function insertProducto(Producto) {
    //Validar estado
    if (!ESTADOS_VALIDOS.includes(Producto.estado)) {
        return Promise.reject(new Error('Estado inválido'));
    }

    const data = readData();
    const newId = data.length > 0 ? Math.max(...data.map(p => p.id)) + 1 : 1;
    Producto.id = newId;

    //Añadir fecha de creación
    Producto.fecha_add = new Date().toISOString();

    data.push(Producto);
    writeData(data);
    return Promise.resolve(newId);
}

function updateProducto(id, Producto) {
    const data = readData();
    const index = data.findIndex(p => p.id === Number(id));
    if (index === -1) return Promise.reject(new Error('No encontrado'));

    //Validar estado
    if (!ESTADOS_VALIDOS.includes(Producto.estado)) {
        return Promise.reject(new Error('Estado inválido'));
    }

    Producto.id = Number(id);

    //Mantener la fecha original si existe
    Producto.fecha_add = data[index].fecha_add || new Date().toISOString();

    data[index] = Producto;
    writeData(data);
    return Promise.resolve();
}

function deleteProducto(id) {
    const data = readData();
    const index = data.findIndex(p => p.id === Number(id));
    if (index === -1) return Promise.reject(new Error('No encontrado'));

    data.splice(index, 1);
    writeData(data);
    return Promise.resolve();
}

module.exports = {
    getProducto,
    getProductoById,
    insertProducto,
    updateProducto,
    deleteProducto
};
