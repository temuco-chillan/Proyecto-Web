const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');
const sesiones = require('../public/js/Sesiones/service');
const productos = require('../public/js/Productos/service');
const carrito = require('../public/js/Carrito/service');
const categorias = require('../public/js/Categorias/service');
const { Categoria } = require('../public/js/Models');
const historial = require('../public/js/Historial/service');
const ganancias = require('../public/js/Ganancias/service');
const https = require('https');
const fs = require('fs');

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
        } else if (err.message === 'RUT_EXISTS') {
            res.status(409).json({ message: 'Este RUT ya está registrado' });
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
        res.json({ mensaje: 'Producto actualizado' });
    } catch (error) {
        if (error.message === 'No encontrado') {
            res.status(404).json({ mensaje: 'No encontrado' });
        } else {
            console.error('❌ Error en PUT /api/Productos/:id:', error);
            res.status(500).json({ error: error.message });
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
        const nueva = await categorias.insertCategoria(nombre);
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
        res.json(data);
    } catch (error) {
        console.error('❌ Error en ruta /categorias:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Asignar categorías (reemplaza todas las anteriores)
app.post('/api/Productos/:id/categorias', async (req, res) => {
    const { categorias } = req.body;
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
        const { id, categoriaId } = req.params;
        await productos.eliminarCategoriaDeProducto(id, categoriaId);
        res.json({ success: true, message: 'Categoría eliminada del producto exitosamente' });
    } catch (error) {
        console.error('Error al eliminar categoría del producto:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

////////////////////////
// MERCADOPAGO
////////////////////////

// Configuración de MercadoPago SDK 2.x
const client = new MercadoPagoConfig({
    accessToken: process.env.Access_token,
    options: {
        timeout: 5000,
        idempotencyKey: 'abc'
    }
});

app.post('/api/pago', async (req, res) => {
    try {
        const { usuario_id } = req.body;
        
        if (!usuario_id) {
            return res.status(400).json({ error: 'usuario_id es requerido' });
        }

        // Obtener información del usuario
        const usuario = await sesiones.getUserById(usuario_id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const carritoItems = await carrito.getCarrito(usuario_id);
        if (!carritoItems || carritoItems.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // Formatear items para MercadoPago
        const items = carritoItems.map(item => ({
            id: item.producto_id.toString(),
            title: item.nombre || `Producto ${item.producto_id}`,
            description: item.descripcion || 'Producto de la tienda',
            quantity: parseInt(item.cantidad),
            unit_price: parseInt(item.precio),
            currency_id: 'CLP'  // Changed from 'COP' to 'ARS'
        }));

        // Formatear información del pagador
        const payer = {
            name: usuario.nombre,
            surname: usuario.apellido || '',
            email: usuario.email,
            phone: {
                area_code: '57',
                number: usuario.telefono || '3001234567'
            },
            identification: {
                type: 'CC',
                number: usuario.cedula || '12345678'
            },
            address: {
                street_name: usuario.direccion || 'Calle 123',
                street_number: 123,
                zip_code: '110111'
            }
        };
        
        const preference = new Preference(client);
        const ngrok = process.env.NGROK_URL;
        const preferenceData = {
            items: items,
            payer: payer,
            back_urls: {
                success: ngrok+"/api/pago-exitoso",
                failure: ngrok+"/api/pago-fallido",
                pending: ngrok+"/api/pago-pendiente"
            },
            auto_return: "approved",
            external_reference: usuario_id.toString(),
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 12
            },
            shipments: {
                mode: "not_specified"
            },
            notification_url: ngrok+"/api/webhook-mercadopago"
        };
        
        const response = await preference.create({ body: preferenceData });
        
        res.cookie('mp_session', usuario_id.toString(), {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 3600000
        });
        
        res.json({ init_point: response.init_point });
    } catch (error) {
        console.error('Error al crear preferencia:', error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
});

// Ruta para el pago exitoso
app.get('/api/pago-exitoso', async (req, res) => {
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

        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.precio) * parseInt(item.cantidad)), 0);

        console.log('Subtotal calculado:', subtotal);

        const detallesVenta = items.map(item => ({
            producto_id: item.producto_id,
            nombre: item.nombre,
            cantidad: parseInt(item.cantidad),
            precio_unitario: parseFloat(item.precio),
            descuento_aplicado: item.descuento_aplicado || 0,
            subtotal: parseFloat(item.precio) * parseInt(item.cantidad)
        }));

        const ventaId = await historial.crearVenta(usuario_id, detallesVenta, payment_id);

        ganancias.agregarGanancia(subtotal, payment_id, usuario_id);

        await carrito.vaciarCarrito(usuario_id);

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

        res.redirect(`/payments/payment-succes.html?${params.toString()}`);

    } catch (error) {
        console.error("Error en pago-exitoso:", error);
        res.redirect('/payments/payment-failed.html?reason=Error interno del servidor');
    }
});

app.get('/api/pago-fallido', async (req, res) => {
    const usuario_id = req.query.external_reference;
    const payment_id = req.query.payment_id;
    const collection_id = req.query.collection_id;

    console.log('Pago fallido recibido:', { usuario_id, payment_id, collection_id });

    const params = new URLSearchParams({
        order_id: payment_id || `ORD-FAIL-${Date.now()}`,
        reason: 'Pago rechazado por la entidad financiera'
    });

    res.redirect(`/payments/payment-failed.html?${params.toString()}`);
});

app.get('/api/pago-pendiente', async (req, res) => {
    const usuario_id = req.query.external_reference;
    const payment_id = req.query.payment_id;
    const collection_id = req.query.collection_id;

    console.log('Pago pendiente:', { usuario_id, payment_id, collection_id });

    try {
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

app.post('/api/webhook-mercadopago', express.raw({type: 'application/json'}), (req, res) => {
    console.log('Webhook recibido:', req.body);
    res.status(200).send('OK');
});

////////////////////////
// RUTAS - HISTORIAL
////////////////////////

app.get('/api/historial/:usuario_id', async (req, res) => {
    try {
        const data = await historial.getHistorialByUsuario(req.params.usuario_id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/historial', async (req, res) => {
    try {
        const { usuario_id, detalles } = req.body;
        const ventaId = await historial.crearVenta(usuario_id, detalles);
        res.status(201).json({ mensaje: 'Venta registrada', venta_id: ventaId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/historial/:venta_id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        await historial.actualizarEstadoVenta(req.params.venta_id, estado);
        res.json({ mensaje: 'Estado actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/historial', async (req, res) => {
    try {
        const data = await historial.getAllHistorial();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

////////////////////////
// RUTAS - GANANCIAS
////////////////////////

app.put('/api/ganancias/porcentaje', async (req, res) => {
    try {
        const { porcentaje } = req.body;
        const resultado = await ganancias.actualizarPorcentaje(porcentaje);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

////////////////////////
// CONFIGURACIÓN DEL SERVIDOR
////////////////////////

const HTTP_PORT = PORT;
const HTTPS_PORT = parseInt(PORT) + 1;

// Iniciar servidor HTTP
app.listen(HTTPS_PORT, () => {
    console.log(`🌐 Servidor HTTP ejecutándose en http://localhost:${HTTP_PORT}`);
    console.log(`📋 Accede a tu aplicación en: http://localhost:${HTTP_PORT}`);
});

// Intentar iniciar servidor HTTPS (opcional)
try {
    if (fs.existsSync('key.pem') && fs.existsSync('cert.pem')) {
        const options = {
            key: fs.readFileSync('key.pem'),
            cert: fs.readFileSync('cert.pem')
        };
        
        https.createServer(options, app).listen(PORT, () => {
            console.log(`🔒 Servidor HTTPS ejecutándose en https://localhost:${HTTPS_PORT}`);
        });
    } else {
        console.log(`⚠️  Certificados SSL no encontrados. Solo HTTP disponible.`);
    }
} catch (error) {
    console.log(`⚠️  Error al iniciar HTTPS: ${error.message}`);
    console.log(`📋 Solo HTTP disponible: http://localhost:${HTTP_PORT}`);
}
app.put('/api/ganancias/porcentaje', async (req, res) => {
    try {
        const { porcentaje } = req.body;
        const resultado = await ganancias.actualizarPorcentaje(porcentaje);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nuevo endpoint para obtener RUT desencriptado (solo para roles autorizados)
app.get('/api/users/:id/rut', async (req, res) => {
    try {
        const { userRole } = req.headers; // Obtener rol del token/sesión
        
        if (userRole !== 'vendedor' && userRole !== 'admin') {
            return res.status(403).json({ message: 'No autorizado para ver RUT completo' });
        }
        
        const user = await sesiones.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Desencriptar RUT solo para roles autorizados
        const decryptedRut = encryptionService.decryptRut(user.rut);
        res.json({ rut: decryptedRut });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
