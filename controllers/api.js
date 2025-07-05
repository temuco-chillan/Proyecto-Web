const express = require('express');
const cors = require('cors');
const path = require("path");

// Importamos módulos de respaldo
const bd_Users = require('../public/js/Sesiones/bd');
const json_Users = require('../public/js/Sesiones/json');

const bd_Productos= require('../public/js/Productos/bd');
const json_Productos = require('../public/js/Productos/json');

const bd_Carrito = require('../public/js/Carrito/bd');
const json_Carrito = require('../public/js/Carrito/json');


const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos CSS desde la carpeta public/css
app.use('/css', express.static(path.join(__dirname, '../public/css'), {
    setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.css') {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

app.use(cors());
app.use(express.json());

// Servir HTML desde public/
app.use(express.static(path.join(__dirname, '../public/views')));
// Servir JS desde scripts/
app.use('/js', express.static(path.join(__dirname, '../public/js')));


// Detectar si usar DB o JSON para usuarios
async function getUserBackend() {
    try {
        const connected = await bd_Users.isConnected();
        return connected ? bd_Users : json_Users;
    } catch (error) {
        console.error('Error checking user DB connection:', error.message);
        return json_Users; // fallback a JSON si falla la DB
    }
}

async function getProductoBackend() {
    try {
        const connected = await bd_Productos.isConnected();
        return connected ? bd_Productos : json_Productos;
    } catch (error) {
        console.error('Error checking computador DB connection:', error.message);
        return json_Productos; // fallback a JSON si falla la DB
    }
}
async function getCarritoBackend() {
    try {
        const connected = await bd_Carrito.isConnected();
        return connected ? bd_Carrito : json_Carrito;
    } catch (error) {
        console.error('Error comprobando conexión a carrito DB:', error.message);
        return json_Carrito;
    }
}



////////////////////////
// RUTAS - USUARIOS
////////////////////////

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
    try {
        const backend = await getUserBackend();
        if (!backend) return res.status(500).json({ error: 'Backend no disponible' });
        const users = await backend.getUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Obtener usuario por ID
app.get('/api/users/:id', async (req, res) => {
    try {
        const backend = await getUserBackend();
        const user = await backend.getUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Registrar nuevo usuario
app.post('/api/users', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña requeridos' });
    }

    try {
        const backend = await getUserBackend();
        const user = await backend.createUser({ username, password });
        res.status(201).json({ message: 'Usuario creado', user });
    } catch (err) {
        if (err.message === 'EXISTS') {
            res.status(409).json({ message: 'El usuario ya existe' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Validar login
app.post('/api/users/validate', async (req, res) => {
    const { username, password } = req.body;
    try {
        const backend = await getUserBackend();
        const user = await backend.validateUser({ username, password });
        if (user) res.json({ message: 'Login exitoso', user });
        else res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

////////////////////////
// RUTAS - Productos //
////////////////////////

app.get('/api/Productos', async (req, res) => {
    try {
        const backend = await getProductoBackend();
        const data = await backend.getProducto();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/Productos/:id', async (req, res) => {
    try {
        const backend = await getProductoBackend();
        const producto = await backend.getProductoById(req.params.id);
        if (!producto) return res.status(404).json({ mensaje: 'No encontrado' });
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/Productos', async (req, res) => {
    try {
        const backend = await getProductoBackend();
        const id = await backend.insertProducto(req.body);
        res.status(201).json({ mensaje: 'producto creado', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/Productos/:id', async (req, res) => {
    try {
        const backend = await getProductoBackend();
        await backend.updateProducto(req.params.id, req.body);
        res.json({ mensaje: 'Producto actualizado' });
    } catch (error) {
        if (error.message === 'No encontrado') return res.status(404).json({ mensaje: 'No encontrado' });
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/Productos/:id', async (req, res) => {
    try {
        const backend = await getProductoBackend();
        await backend.deleteProducto(req.params.id);
        res.json({ mensaje: 'producto eliminado' });
    } catch (error) {
        if (error.message === 'No encontrado') return res.status(404).json({ mensaje: 'No encontrado' });
        res.status(500).json({ error: error.message });
    }
});

////////////////////////
// RUTAS - CARRITO
////////////////////////

// Obtener carrito de un usuario
app.get('/api/carrito/:usuario_id', async (req, res) => {
    try {
        const backend = await getCarritoBackend();
        const carrito = await backend.getCarrito(req.params.usuario_id);
        res.json(carrito);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Agregar producto al carrito (o sumar cantidad)
app.post('/api/carrito', async (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body;
    if (!usuario_id || !producto_id || !cantidad) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const backend = await getCarritoBackend();
        await backend.agregarAlCarrito(usuario_id, producto_id, cantidad);
        res.status(201).json({ mensaje: 'Producto agregado/actualizado en carrito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar cantidad de un producto en el carrito
app.put('/api/carrito', async (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body;
    if (!usuario_id || !producto_id || !cantidad) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const backend = await getCarritoBackend();
        await backend.actualizarCantidadCarrito(usuario_id, producto_id, cantidad);
        res.json({ mensaje: 'Cantidad actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Eliminar un producto del carrito
app.delete('/api/carrito', async (req, res) => {
    const { usuario_id, producto_id } = req.body;
    if (!usuario_id || !producto_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        const backend = await getCarritoBackend();
        await backend.eliminarDelCarrito(usuario_id, producto_id);
        res.json({ mensaje: 'Producto eliminado del carrito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vaciar carrito completo del usuario
app.delete('/api/carrito/usuario/:usuario_id', async (req, res) => {
    try {
        const backend = await getCarritoBackend();
        await backend.vaciarCarrito(req.params.usuario_id);
        res.json({ mensaje: 'Carrito vaciado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

////////////////////////
// INICIAR SERVIDOR
////////////////////////

app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
