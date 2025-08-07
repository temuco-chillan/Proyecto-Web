const express = require('express');
const cors = require('cors');
const path = require('path');

const mercadopago = require('mercadopago');

const sesiones = require('../public/js/Sesiones/service');
const productos = require('../public/js/Productos/service');
const carrito = require('../public/js/Carrito/service');
const categorias = require('../public/js/Categorias/service');
const { Categoria } = require('../public/js/Models');
const historial = require('../public/js/Historial/service');

const { title } = require('process');
const nTunel = "548200159a34";
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use('/css', express.static(path.join(__dirname, '../public/css'), {
    setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.css') {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use(express.static(path.join(__dirname, '../public/views')));

app.use(cors());
app.use(express.json());

////////////////////////
// RUTAS - USUARIOS
////////////////////////

app.get('/api/users', async (req, res) => {
    try {
        const users = await sesiones.getUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await sesiones.getUserById(req.params.id);
        user ? res.json(user) : res.status(404).json({ message: 'Usuario no encontrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    const { username, email, password, rol_id = 2 } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    try {
        const user = await sesiones.createUser({ username, email, password, rol_id });
        res.status(201).json({ message: 'Usuario creado', user });
    } catch (err) {
        if (err.message === 'USERNAME_EXISTS') {
            res.status(409).json({ message: 'El nombre de usuario ya está en uso' });
        } else if (err.message === 'EMAIL_EXISTS') {
            res.status(409).json({ message: 'El correo electrónico ya está en uso' });
        } else {
            console.error('Error en registro:', err);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    }
});


app.post('/api/users/validate', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await sesiones.validateUser({ username, password });
        user ? res.json({ message: 'Login exitoso', user }) : res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

////////////////////////
// RUTAS - PRODUCTOS
////////////////////////

app.get('/api/Productos', async (req, res) => {
    try {
        const data = await productos.getProductos();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/Productos/:id', async (req, res) => {
    try {
        const producto = await productos.getProductoById(req.params.id);
        producto ? res.json(producto) : res.status(404).json({ mensaje: 'No encontrado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/Productos', async (req, res) => {
    try {
        const id = await productos.insertProducto(req.body);
        res.status(201).json({ mensaje: 'Producto creado', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/Productos/:id', async (req, res) => {
    try {
        await productos.updateProducto(req.params.id, req.body);
        res.json({ mensaje: 'Producto actualizado' }); // ✅ importante
    } catch (error) {
        if (error.message === 'No encontrado') {
            res.status(404).json({ mensaje: 'No encontrado' });
        } else {
            console.error('❌ Error en PUT /api/Productos/:id:', error); // 👈 muestra el error
            res.status(500).json({ error: error.message }); // ✅ importante
        }
    }
});


app.delete('/api/Productos/:id', async (req, res) => {
    try {
        await productos.deleteProducto(req.params.id);
        res.json({ mensaje: 'Producto eliminado' });
    } catch (error) {
        if (error.message === 'No encontrado') {
            res.status(404).json({ mensaje: 'No encontrado' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

////////////////////////
// RUTAS - CARRITO
////////////////////////

app.get('/api/carrito/:usuario_id', async (req, res) => {
    try {
        const data = await carrito.getCarrito(req.params.usuario_id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/carrito', async (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body;
    if (!usuario_id || !producto_id || !cantidad) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        await carrito.agregarAlCarrito(usuario_id, producto_id, cantidad);
        res.status(201).json({ mensaje: 'Producto agregado/actualizado en carrito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/carrito', async (req, res) => {
    const { usuario_id, producto_id, cantidad } = req.body;
    if (!usuario_id || !producto_id || !cantidad) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        await carrito.actualizarCantidadCarrito(usuario_id, producto_id, cantidad);
        res.json({ mensaje: 'Cantidad actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/carrito', async (req, res) => {
    const { usuario_id, producto_id } = req.body;
    if (!usuario_id || !producto_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        await carrito.eliminarDelCarrito(usuario_id, producto_id);
        res.json({ mensaje: 'Producto eliminado del carrito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/carrito/usuario/:usuario_id', async (req, res) => {
    try {
        await carrito.vaciarCarrito(req.params.usuario_id);
        res.json({ mensaje: 'Carrito vaciado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
////////////////////////
// CATEGORIAS
////////////////////////

app.get('/api/categorias', async (req, res) => {
    try {
        const data = await categorias.getCategorias();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/categorias', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    try {
        const nueva = await categorias.insertCategoria(nombre); // ✅
        res.status(201).json(nueva);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Obtener las categorías de un producto
app.get('/api/Productos/:id/categorias', async (req, res) => {
    try {
        const data = await productos.getCategoriasDeProducto(req.params.id);
        if (!data) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json(data); // Puede ser `[]` si no hay categorías
    } catch (error) {
        console.error('❌ Error en ruta /categorias:', error.message);
        res.status(500).json({ error: error.message });
    }
});



// Asignar categorías (reemplaza todas las anteriores)
app.post('/api/Productos/:id/categorias', async (req, res) => {
    const { categorias } = req.body; // array de IDs
    if (!Array.isArray(categorias)) {
        return res.status(400).json({ error: 'Debe enviar un array de IDs de categorías' });
    }

    try {
        await productos.asignarCategoriasAProducto(req.params.id, categorias);
        res.status(200).json({ mensaje: 'Categorías asignadas correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Agregar una sola categoría (sin borrar las anteriores)
app.post('/api/Productos/:id/categorias/:categoriaId', async (req, res) => {
    try {
        await productos.agregarCategoriaAProducto(req.params.id, req.params.categoriaId);
        res.status(200).json({ mensaje: 'Categoría añadida al producto' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Quitar una categoría del producto
app.delete('/api/Productos/:id/categorias/:categoriaId', async (req, res) => {
    try {
        await productos.quitarCategoriaAProducto(req.params.id, req.params.categoriaId);
        res.status(200).json({ mensaje: 'Categoría eliminada del producto' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

////////////////////////
// MercadoPago
////////////////////////
// configuramos el access token
mercadopago.configure({
    //configuracion de usuario vendedor en mercado libre de prueba.
    access_token: "APP_USR-5491912017954458-071117-bb82d2bc034b99dfd56644e4caf03e1a-2549815434"
});
app.post('/api/pago', async (req, res) => {
    const { usuario_id } = req.body;
    //validara el id del usuario
    if (!usuario_id) {
        return res.status(400).json({ error: 'Falta el ID del usuario' });
    }

    try {
        const items = await carrito.getCarrito(usuario_id);

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrito vacío' });
        }
        //tomara las preferencias del carrito 
        const preference = {
            items: items.map(item => ({
                title: item.nombre,
                quantity: parseInt(item.cantidad),
                unit_price: parseFloat(item.precio),
                currency_id: "CLP"
            })),
            // --- ¡IMPORTANTE! Aquí se actualizan las URLs para usar ngrok ---
            back_urls: {
                success: "https://2340daac61ca.ngrok-free.app/api/pago-exitoso",
                failure: "https://df7b8b359ee8.ngrok-free.app/api/pago-fallido",
                pending: "https://df7b8b359ee8.ngrok-free.app/api/pago-pendiente"
            },
            external_reference: String(usuario_id),
            auto_return: "approved" // <- debe ir acompañado de un success definido
        };


        const response = await mercadopago.preferences.create(preference);
        res.json({ init_point: response.body.init_point });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la preferencia de pago' });
    }
});
app.get('/api/pago-exitoso', async (req, res) => {
    const usuario_id = parseInt(req.query.external_reference); // Convertir a entero
    const payment_id = req.query.payment_id;

    if (!usuario_id || isNaN(usuario_id)) {
        return res.status(400).send("No se pudo identificar al usuario o ID inválido.");
    }

    if (!payment_id) {
        return res.status(400).send("No se pudo identificar el payment_id.");
    }

    try {
        const user = await sesiones.getUserById(usuario_id);
        const items = await carrito.getCarrito(usuario_id);

        if (!user || !items || items.length === 0) {
            return res.status(404).send("Datos no encontrados.");
        }

        // 📝 Registrar la venta en el historial ANTES de vaciar el carrito
        const detallesVenta = items.map(item => ({
            producto_id: item.producto_id,
            nombre: item.nombre,
            cantidad: parseInt(item.cantidad),
            precio_unitario: parseFloat(item.precio),
            descuento_aplicado: item.descuento || 0,
            subtotal: parseFloat(item.precio) * parseInt(item.cantidad) * (1 - (item.descuento || 0)/100)
        }));

        // Pasar el payment_id al crear la venta
        const ventaId = await historial.crearVenta(usuario_id, detallesVenta, payment_id);
        
        // 🧹 Vaciar el carrito después de registrar la venta
        await carrito.vaciarCarrito(usuario_id);
        
        res.json({
            mensaje: "¡Pago exitoso!",
            usuario: user.username,
            usuario_id: usuario_id,
            payment_id: payment_id,
            venta_id: ventaId,
            total: detallesVenta.reduce((sum, item) => sum + item.subtotal, 0),
            productos: items.map(item => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: parseFloat(item.precio) * parseInt(item.cantidad)
            }))
        });

    } catch (error) {
        console.error("Error en pago-exitoso:", error);
        res.status(500).send("Error al procesar el pago exitoso.");
    }
});


////////////////////////
// INICIAR SERVIDOR
////////////////////////

app.listen(PORT, () => {
    console.log(`✅ API corriendo en http://localhost:${PORT}`);
});


////////////////////////
// RUTAS - HISTORIAL
////////////////////////

app.get('/api/historial/:usuario_id', async (req, res) => {
    try {
        const data = await historial.getHistorial(req.params.usuario_id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/historial', async (req, res) => {
    const { usuario_id, detalles } = req.body;
    if (!usuario_id || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ error: 'Datos de venta inválidos' });
    }

    try {
        const ventaId = await historial.crearVenta(usuario_id, detalles);
        res.status(201).json({ mensaje: 'Venta registrada', venta_id: ventaId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/historial/:venta_id/estado', async (req, res) => {
    const { estado } = req.body;
    if (!estado || !['completada', 'cancelada', 'pendiente'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    try {
        await historial.actualizarEstadoVenta(req.params.venta_id, estado);
        res.json({ mensaje: 'Estado de venta actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//ruta admin
app.get('/api/historial', async (req, res) => {
    try {
        const data = await historial.getAllHistorial();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
