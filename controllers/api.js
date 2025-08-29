const express = require('express');
const cors = require('cors');
const path = require('path');

// ✅ CORRECCIÓN: Importación correcta para SDK v2.x
const mercadopago = require('mercadopago');
const sesiones = require('../public/js/Sesiones/service');
const productos = require('../public/js/Productos/service');
const carrito = require('../public/js/Carrito/service');
const categorias = require('../public/js/Categorias/service');
const { Categoria } = require('../public/js/Models');
const historial = require('../public/js/Historial/service');
const ganancias = require('../public/js/Ganancias/service');

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
    const { 
        username, 
        email, 
        password, 
        rut, 
        telefono, 
        direccion, 
        ciudad, 
        region,
        rol_id = 2 
    } = req.body;

    if (!username || !email || !password || !rut || !telefono || !direccion || !ciudad || !region) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados' });
    }

    try {
        const userData = {
            username, 
            email, 
            password, 
            rut, 
            telefono, 
            direccion, 
            ciudad, 
            region, 
            rol_id
        };
        
        const user = await sesiones.createUser(userData);
        res.status(201).json({ message: 'Cuenta creada exitosamente', user });
    } catch (err) {
        if (err.message === 'USERNAME_EXISTS') {
            res.status(409).json({ message: 'Este nombre de usuario ya está registrado' });
        } else if (err.message === 'EMAIL_EXISTS') {
            res.status(409).json({ message: 'Este correo electrónico ya está en uso' });
        } else {
            console.error('Error en registro:', err);
            res.status(500).json({ message: 'Error interno del servidor. Intenta nuevamente' });
        }
    }
});

app.post('/api/users/validate', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await sesiones.validateUser({ username, password });
        user ? res.json({ message: 'Acceso autorizado', user }) : res.status(401).json({ message: 'Credenciales incorrectas' });
    } catch (err) {
        res.status(500).json({ error: 'Error del servidor al validar usuario' });
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
    const { 
        username, 
        email, 
        password, 
        rut, 
        telefono, 
        direccion, 
        ciudad, 
        region,
        rol_id = 2 
    } = req.body;

    if (!username || !email || !password || !rut || !telefono || !direccion || !ciudad || !region) {
        return res.status(400).json({ message: 'Todos los campos obligatorios son requeridos' });
    }

    try {
        const userData = {
            username, 
            email, 
            password, 
            rut, 
            telefono, 
            direccion, 
            ciudad, 
            region, 
            rol_id
        };
        
        const user = await sesiones.createUser(userData);
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
        await carrito.actualizarCantidad(usuario_id, producto_id, cantidad);
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
// ✅ CORRECCIÓN: Configuración correcta para SDK v2.x
mercadopago.configure({
    access_token: "APP_USR-5491912017954458-071117-bb82d2bc034b99dfd56644e4caf03e1a-2549815434"
});

app.post('/api/pago', async (req, res) => {
    const { usuario_id } = req.body;
    if (!usuario_id) {
        return res.status(400).json({ error: 'Falta el ID del usuario' });
    }

    try {
        const items = await carrito.getCarrito(usuario_id);
        const ngrok = "https://6bea2d8ec0fa.ngrok-free.app";
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Carrito vacío' });
        }

        // ✅ NUEVA VALIDACIÓN: Verificar stock antes de proceder al pago
        for (const item of items) {
            const producto = await productos.getProductoById(item.producto_id);
            if (!producto) {
                return res.status(400).json({
                    error: `Producto ${item.nombre} no encontrado`
                });
            }

            if (producto.stock < item.cantidad) {
                return res.status(400).json({
                    error: `Stock insuficiente para ${item.nombre}. Stock disponible: ${producto.stock}, cantidad solicitada: ${item.cantidad}`
                });
            }
        }

        // ✅ CORRECCIÓN: Usar la API correcta para SDK v2.x
        const preferenceBody = {
            items: items.map(item => {
                const precio = parseFloat(item.precio);
                console.log('Precio original:', item.precio, 'Precio parseado:', precio, 'Precio redondeado:', Math.round(precio));

                return {
                    title: item.nombre,
                    quantity: parseInt(item.cantidad),
                    unit_price: Math.round(precio),
                    currency_id: "CLP"
                };
            }),
            back_urls: {
                success: ngrok + "/api/pago-exitoso",
                failure: ngrok + "/api/pago-fallido",
                pending: ngrok + "/api/pago-pendiente"
            },
            external_reference: String(usuario_id),
            auto_return: "approved"
        };

        const response = await mercadopago.preferences.create(preferenceBody);
        res.json({ init_point: response.body.init_point });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear la preferencia de pago' });
    }
});

// Ruta para el pago exitoso
app.get('/api/pago-exitoso', async (req, res) => {
    // Los datos se obtienen de los parámetros de la URL
    const { external_reference, payment_id } = req.query;
    const usuario_id = parseInt(external_reference);

    console.log('Pago Exitoso Recibido:', { external_reference, payment_id });

    if (!usuario_id || isNaN(usuario_id)) {
        return res.redirect('/payments/payment-failed.html?reason=Usuario no identificado');
    }

    if (!payment_id) {
        return res.redirect('/payments/payment-failed.html?reason=ID de pago no encontrado');
    }

    try {
        const user = await sesiones.getUserById(usuario_id);
        const items = await carrito.getCarrito(usuario_id);

        if (!user || !items || items.length === 0) {
            return res.redirect('/payments/payment-failed.html?reason=Datos de compra no encontrados');
        }

        // ✅ VERIFICAR SI LA VENTA YA FUE PROCESADA CON ESTE payment_id
        const ventaExistente = await historial.getVentaByPaymentId(payment_id);
        if (ventaExistente) {
            console.log('Venta ya procesada:', payment_id);
            const params = new URLSearchParams({
                order_id: payment_id,
                user_id: usuario_id,
                subtotal: ventaExistente.subtotal.toFixed(2),
                items: JSON.stringify(ventaExistente.detalles)
            });
            return res.redirect(`/payments/payment-success.html?${params.toString()}`);
        }

        // ✅ CALCULAR SUBTOTAL CON PRECIOS YA DESCONTADOS
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.precio) * parseInt(item.cantidad)), 0);

        console.log('Subtotal calculado:', subtotal);

        // 📝 Registrar la venta en el historial
        const detallesVenta = items.map(item => ({
            producto_id: item.producto_id,
            nombre: item.nombre,
            cantidad: parseInt(item.cantidad),
            precio_unitario: parseFloat(item.precio), // Ya incluye descuentos
            descuento_aplicado: item.descuento_aplicado || 0, // Usar descuento_aplicado en lugar de descuento
            subtotal: parseFloat(item.precio) * parseInt(item.cantidad) // Sin aplicar descuentos adicionales
        }));

        const ventaId = await historial.crearVenta(usuario_id, detallesVenta, payment_id);

        // 💰 AGREGAR GANANCIA AL SISTEMA DE ACUMULACIÓN
        ganancias.agregarGanancia(subtotal, payment_id, usuario_id);

        // 🧹 Vaciar el carrito después de registrar la venta
        await carrito.vaciarCarrito(usuario_id);

        // ✅ PASAR SOLO LOS DATOS NECESARIOS
        const params = new URLSearchParams({
            order_id: payment_id,
            user_id: usuario_id,
            payment_id: payment_id,
            subtotal: subtotal.toFixed(2),
            items: JSON.stringify(items.map(item => ({
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: parseFloat(item.precio).toFixed(2)
            })))
        });

        console.log('Parámetros enviados:', params.toString());

        // Redirigir a la página de éxito
        res.redirect(`/payments/payment-succes.html?${params.toString()}`);

    } catch (error) {
        console.error("Error en pago-exitoso:", error);
        res.redirect('/payments/payment-failed.html?reason=Error interno del servidor');
    }
});


// Buscar y reemplazar la ruta /api/pago-fallido
app.get('/api/pago-fallido', async (req, res) => {
    const usuario_id = req.query.external_reference;
    const payment_id = req.query.payment_id;
    const collection_id = req.query.collection_id;

    console.log('Pago fallido recibido:', { usuario_id, payment_id, collection_id });

    const params = new URLSearchParams({
        order_id: payment_id || `ORD-FAIL-${Date.now()}`,
        reason: 'Pago rechazado por la entidad financiera'
    });

    // ✅ CORREGIR: payment-failed.html (no payments-failed.html)
    res.redirect(`/payments/payment-failed.html?${params.toString()}`);
});

app.get('/api/pago-pendiente', async (req, res) => {
    const usuario_id = req.query.external_reference;
    const payment_id = req.query.payment_id;
    const collection_id = req.query.collection_id;

    console.log('Pago pendiente:', { usuario_id, payment_id, collection_id });

    try {
        // Obtener información del carrito si el usuario existe
        let total = 0;
        if (usuario_id && !isNaN(parseInt(usuario_id))) {
            const items = await carrito.getCarrito(parseInt(usuario_id));
            total = items.reduce((sum, item) => sum + (parseFloat(item.precio) * parseInt(item.cantidad)), 0);
        }

        const params = new URLSearchParams({
            status: 'pending',
            order_id: `ORD-${Date.now()}`,
            amount: total,
            payment_id: payment_id || 'N/A'
        });

        res.redirect(`/payments/payments-pending.html?${params.toString()}`);
    } catch (error) {
        console.error('Error en pago pendiente:', error);
        const params = new URLSearchParams({
            status: 'pending',
            order_id: `ORD-${Date.now()}`,
            reason: 'Pago en proceso de verificación'
        });
        res.redirect(`/payments.html?${params.toString()}`);
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
// Endpoint para obtener ganancias acumuladas
app.get('/api/ganancias', async (req, res) => {
    try {
        const datosGanancias = ganancias.obtenerGanancias();
        res.json(datosGanancias);
    } catch (error) {
        console.error('Error al obtener ganancias:', error);
        res.status(500).json({ error: 'Error al obtener ganancias' });
    }
});

// Endpoint para actualizar porcentaje de ganancia
app.put('/api/ganancias/porcentaje', async (req, res) => {
    try {
        const { porcentaje } = req.body;
        
        if (!porcentaje || porcentaje < 0 || porcentaje > 100) {
            return res.status(400).json({ error: 'Porcentaje debe estar entre 0 y 100' });
        }
        
        const actualizado = ganancias.actualizarPorcentaje(porcentaje);
        
        if (actualizado) {
            res.json({ message: 'Porcentaje actualizado correctamente', porcentaje });
        } else {
            res.status(500).json({ error: 'Error al actualizar porcentaje' });
        }
    } catch (error) {
        console.error('Error al actualizar porcentaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});
