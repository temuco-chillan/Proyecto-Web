const express = require('express');
const cors = require('cors');
const path = require("path");

// Importamos módulos de respaldo
const bd_Users = require('../public/js/Sesiones/bd');
const json_Users = require('../public/js/Sesiones/json');

const bd_Computadores = require('../public/js/Productos/bd');
const json_Computadores = require('../public/js/Productos/json');

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

async function getComputadorBackend() {
    try {
        const connected = await bd_Computadores.isConnected();
        return connected ? bd_Computadores : json_Computadores;
    } catch (error) {
        console.error('Error checking computador DB connection:', error.message);
        return json_Computadores; // fallback a JSON si falla la DB
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
// RUTAS - COMPUTADORES //
////////////////////////

app.get('/api/computadores', async (req, res) => {
    try {
        const backend = await getComputadorBackend();
        const data = await backend.getComputadores();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/computadores/:id', async (req, res) => {
    try {
        const backend = await getComputadorBackend();
        const computador = await backend.getComputadorById(req.params.id);
        if (!computador) return res.status(404).json({ mensaje: 'No encontrado' });
        res.json(computador);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/computadores', async (req, res) => {
    try {
        const backend = await getComputadorBackend();
        const id = await backend.insertComputador(req.body);
        res.status(201).json({ mensaje: 'Computador creado', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/computadores/:id', async (req, res) => {
    try {
        const backend = await getComputadorBackend();
        await backend.updateComputador(req.params.id, req.body);
        res.json({ mensaje: 'Computador actualizado' });
    } catch (error) {
        if (error.message === 'No encontrado') return res.status(404).json({ mensaje: 'No encontrado' });
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/computadores/:id', async (req, res) => {
    try {
        const backend = await getComputadorBackend();
        await backend.deleteComputador(req.params.id);
        res.json({ mensaje: 'Computador eliminado' });
    } catch (error) {
        if (error.message === 'No encontrado') return res.status(404).json({ mensaje: 'No encontrado' });
        res.status(500).json({ error: error.message });
    }
});

////////////////////////
// INICIAR SERVIDOR
////////////////////////

app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
