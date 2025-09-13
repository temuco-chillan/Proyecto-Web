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
const descuentos = require('../public/js/Descuentos/service');
const https = require('https');
const fs = require('fs');

const { title } = require('process');
const nTunel = "548200159a34";
const app = express();
const PORT = process.env.PORT || 3000;

// === Sesiones y CORS ===
const session = require('express-session');
let RedisStore, createClient;
try {
    RedisStore = require('connect-redis').default;
    ({ createClient } = require('redis'));
} catch (e) {
    // En desarrollo puede no estar instalado Redis, se usará MemoryStore
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET; // Debe estar definido en .env
if (!SESSION_SECRET) {
    console.warn('ADVERTENCIA: Falta SESSION_SECRET en variables de entorno. Define uno seguro en .env');
}

if (NODE_ENV === 'production') {
    app.set('trust proxy', 1); // necesario si estás detrás de un proxy o en plataformas como Heroku/Render
}

// Configuración de CORS con credenciales y orígenes permitidos
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
// Si no configuras CORS_ORIGINS, se permitirá cualquier origen en desarrollo (no recomendado en prod)
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true); // requests sin origin (postman, curl) permitidas
        if (allowedOrigins.length === 0 && NODE_ENV !== 'production') return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS: ' + origin));
    },
    credentials: true
};

// Body parser
app.use(express.json());

// Habilitar CORS ANTES de las rutas
app.use(cors(corsOptions));

// Configurar Redis store en producción si REDIS_URL está disponible
let sessionStore;
if (NODE_ENV === 'production' && RedisStore && process.env.REDIS_URL) {
    const redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => console.error('Redis error', err));
    redisClient.connect().catch(err => console.error('Redis connect error', err));
    sessionStore = new RedisStore({ client: redisClient, prefix: 'sess:' });
}

// Definir sameSite y secure según entorno o envs
const cookieSameSite = (process.env.SESSION_SAMESITE || (NODE_ENV === 'production' ? 'lax' : 'lax')).toLowerCase();
// Nota: si tu frontend está en OTRO dominio, para que el navegador envíe cookie cross-site, usa sameSite='none' y secure: true.
const cookieSecure = NODE_ENV === 'production' ? true : false;

app.use(session({
    name: 'sid',
    secret: SESSION_SECRET || 'dev-insecure-secret',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite, // 'lax'/'strict' en mismo dominio; 'none' si necesitas cross-site
        maxAge: 1000 * 60 * 60 * 2 // 2 horas
    }
}));

// Middlewares de seguridad
function ensureAuth(req, res, next) {
    const auth = req.session && req.session.auth;
    if (auth && auth.userId) {
        req.userId = auth.userId;
        req.role = auth.role;
        return next();
    }
    return res.status(401).json({ message: 'No autenticado' });
}

function ensureRole(role) {
    return (req, res, next) => {
        const auth = req.session && req.session.auth;
        if (!auth || !auth.userId) return res.status(401).json({ message: 'No autenticado' });
        if (auth.role === role) return next();
        return res.status(403).json({ message: 'Acceso denegado' });
    };
}

function ensureOwnerOrAdmin(paramName = 'id') {
    return (req, res, next) => {
        const auth = req.session && req.session.auth;
        if (!auth || !auth.userId) return res.status(401).json({ message: 'No autenticado' });
        if (auth.role === 'admin') return next();
        const target = parseInt(req.params[paramName], 10);
        if (!isNaN(target) && target === auth.userId) return next();
        return res.status(403).json({ message: 'Acceso denegado' });
    };
}

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
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use(cors());
app.use(express.json());

////////////////////////
// RUTAS - USUARIOS
////////////////////////

app.get('/api/users', ensureRole('admin'), async (req, res) => {
    try {
        const users = await sesiones.getUsers();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/me', ensureAuth, async (req, res) => {
    try {
        const user = await sesiones.getUserById(req.userId);
        user ? res.json(user) : res.status(404).json({ message: 'Usuario no encontrado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:id', ensureOwnerOrAdmin('id'), async (req, res) => {
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
        nombreCompleto,
        email, 
        password, 
        rut, 
        telefono, 
        direccion, 
        ciudad, 
        region
    } = req.body;

    if (!username || !nombreCompleto || !email || !password || !rut || !telefono || !direccion || !ciudad || !region) {
        return res.status(400).json({ message: 'Todos los campos obligatorios deben ser completados' });
    }

    try {
        const userData = {
            username, 
            nombreCompleto,
            email, 
            password, 
            rut, 
            telefono, 
            direccion, 
            ciudad, 
            region
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

// Nuevo endpoint de login con sesión
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await sesiones.validateUser({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }
        req.session.regenerate((err) => {
            if (err) {
                console.error('Error al regenerar sesión:', err);
                return res.status(500).json({ message: 'Error al iniciar sesión' });
            }
            req.session.auth = { userId: user.id, role: user.rol || 'usuario' };
            res.json({ message: 'Acceso autorizado', user: { id: user.id, username: user.username, rol: user.rol || 'usuario' } });
        });
    } catch (err) {
        console.error('Error del servidor al validar usuario:', err);
        res.status(500).json({ error: 'Error del servidor al validar usuario' });
    }
});

// Logout
app.post('/api/logout', ensureAuth, (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).json({ message: 'Error al cerrar sesión' });
        }
        res.clearCookie('sid');
        res.json({ message: 'Sesión cerrada' });
    });
});

// IMPORTANTE: elimina/retira el endpoint antiguo /api/users/validate para evitar duplicados.
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

// Nueva ruta para obtener solo el carrusel de imágenes de un producto
app.get('/api/Productos/:id/carrusel', async (req, res) => {
    try {
        const carrusel = await productos.getCarruselById(req.params.id);
        if (carrusel === null) {
            return res.status(404).json({ mensaje: 'Producto no encontrado o sin carrusel' });
        }
        res.json({ img_carrusel: carrusel });
    } catch (error) {
        console.error('Error al obtener carrusel:', error);
        res.status(500).json({ error: error.message });
    }
});

// Nueva ruta API dinámica para servir producto.html con ID del producto
app.get('/producto/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Validar que el ID sea un número válido
        if (!productId || isNaN(productId) || parseInt(productId) <= 0) {
            return res.status(400).json({ 
                error: 'ID de producto inválido. Debe ser un número positivo.' 
            });
        }
        
        // Verificar que el producto existe en la base de datos
        const producto = await productos.getProductoById(parseInt(productId));
        if (!producto) {
            return res.status(404).json({ 
                error: 'Producto no encontrado.' 
            });
        }
        
        // Verificar que el archivo producto.html existe
        const productoHtmlPath = path.join(__dirname, '../public/views/producto.html');
        if (!fs.existsSync(productoHtmlPath)) {
            return res.status(500).json({ 
                error: 'Archivo de producto no encontrado en el servidor.' 
            });
        }
        
        // Leer el archivo HTML
        let htmlContent = fs.readFileSync(productoHtmlPath, 'utf8');
        
        // Inyectar datos del producto en el HTML
        const productScript = `
            <script>
                window.productData = ${JSON.stringify(producto)};
                window.productId = ${productId};
                console.log('Datos del producto inyectados:', window.productData);
            </script>
        `;
        
        // Insertar el script antes del cierre del tag body
        htmlContent = htmlContent.replace('</body>', `${productScript}</body>`);
        
        // Establecer headers apropiados
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Enviar el archivo HTML modificado
        res.send(htmlContent);
        
    } catch (error) {
        console.error('Error al servir producto:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al cargar el producto.' 
        });
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

app.get('/api/carrito', ensureAuth, async (req, res) => {
    try {
        const data = await carrito.getCarrito(req.userId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/carrito', ensureAuth, async (req, res) => {
    const { producto_id, cantidad } = req.body;
    if (!producto_id || !cantidad) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        await carrito.agregarAlCarrito(req.userId, producto_id, cantidad);
        res.status(201).json({ mensaje: 'Producto agregado/actualizado en carrito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/carrito', ensureAuth, async (req, res) => {
    const { producto_id, cantidad } = req.body;
    if (!producto_id || !cantidad) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        await carrito.actualizarCantidad(req.userId, producto_id, cantidad);
        res.json({ mensaje: 'Cantidad actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/carrito', ensureAuth, async (req, res) => {
    const { producto_id } = req.body;
    if (!producto_id) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    try {
        await carrito.eliminarDelCarrito(req.userId, producto_id);
        res.json({ mensaje: 'Producto eliminado del carrito' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/carrito/clear', ensureAuth, async (req, res) => {
    try {
        await carrito.vaciarCarrito(req.userId);
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

app.post('/api/pago', ensureAuth, async (req, res) => {
    try {
        const usuario_id = req.userId;

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
        const ngrok = process.env.Dominio_H;
        const preferenceData = {
            items: items,
            payer: payer,
            back_urls: {
                success: ngrok + "/api/pago-exitoso",
                failure: ngrok + "/api/pago-fallido",
                pending: ngrok + "/api/pago-pendiente"
            },
            auto_return: "approved",
            // external_reference solo como apoyo (no se confía en él para identidad)
            external_reference: usuario_id.toString(),
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 12
            },
            shipments: {
                mode: "not_specified"
            },
            notification_url: ngrok + "/api/webhook-mercadopago"
        };
        
        const response = await preference.create({ body: preferenceData });
        // NO seteamos cookies manuales aquí; la sesión ya maneja la cookie.
        res.json({ init_point: response.init_point });
    } catch (error) {
        console.error('Error al crear preferencia:', error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
});

// Pago exitoso (se espera que el usuario mantenga su sesión activa)
app.get('/api/pago-exitoso', ensureAuth, async (req, res) => {
    const { payment_id } = req.query;
    const usuario_id = req.userId;

    if (!payment_id) {
        return res.redirect('/payments/payment-failed.html?reason=ID de pago no encontrado');
    }

    try {
        const user = await sesiones.getUserById(usuario_id);
        const items = await carrito.getCarrito(usuario_id);

        if (!user || !items || items.length === 0) {
            return res.redirect('/payments/payment-failed.html?reason=Datos de compra no encontrados');
        }

        // Validación básica: evitar doble procesamiento por payment_id
        const ventaExistente = await historial.getVentaByPaymentId(payment_id);
        if (ventaExistente) {
            const params = new URLSearchParams({
                order_id: payment_id,
                user_id: usuario_id,
                subtotal: ventaExistente.subtotal.toFixed(2),
                items: JSON.stringify(ventaExistente.detalles)
            });
            return res.redirect(`/payments/payment-success.html?${params.toString()}`);
        }

        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.precio) * parseInt(item.cantidad)), 0);

        const detallesVenta = items.map(item => ({
            producto_id: item.producto_id,
            nombre: item.nombre,
            cantidad: parseInt(item.cantidad),
            precio_unitario: parseFloat(item.precio),
            descuento_aplicado: item.descuento_aplicado || 0,
            subtotal: parseFloat(item.precio) * parseInt(item.cantidad)
        }));

        await historial.crearVenta(usuario_id, detallesVenta, payment_id);
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

        res.redirect(`/payments/payment-succes.html?${params.toString()}`);

    } catch (error) {
        console.error("Error en pago-exitoso:", error);
        res.redirect('/payments/payment-failed.html?reason=Error interno del servidor');
    }
});

app.get('/api/pago-fallido', ensureAuth, async (req, res) => {
    const payment_id = req.query.payment_id;
    const collection_id = req.query.collection_id;

    console.log('Pago fallido recibido:', { userId: req.userId, payment_id, collection_id });

    const params = new URLSearchParams({
        order_id: payment_id || `ORD-FAIL-${Date.now()}`,
        reason: 'Pago rechazado por la entidad financiera'
    });

    res.redirect(`/payments/payment-failed.html?${params.toString()}`);
});

app.get('/api/pago-pendiente', ensureAuth, async (req, res) => {
    const payment_id = req.query.payment_id;
    const collection_id = req.query.collection_id;

    console.log('Pago pendiente:', { userId: req.userId, payment_id, collection_id });

    try {
        const items = await carrito.getCarrito(req.userId);
        const total = items.reduce((sum, item) => sum + (parseFloat(item.precio) * parseInt(item.cantidad)), 0);

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
    // Verificar si el webhook está habilitado
    const webhookEnabled = process.env.WEBHOOK_ENABLED !== 'false';
    
    if (!webhookEnabled) {
        console.log('⚠️ Webhook desactivado por configuración');
        return res.status(200).json({ 
            status: 'disabled', 
            message: 'Webhook temporalmente desactivado' 
        });
    }
    
    console.log('Webhook recibido:', req.body);
    res.status(200).send('OK');
});

////////////////////////
// RUTAS - HISTORIAL
////////////////////////

app.get('/api/historial', ensureAuth, async (req, res) => {
    try {
        const data = await historial.getHistorial(req.userId);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: ver todo el historial
app.get('/api/historial/admin', ensureRole('admin'), async (req, res) => {
    try {
        const data = await historial.getAllHistorial();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/historial', ensureAuth, async (req, res) => {
    try {
        const { detalles } = req.body; // usuario actual desde sesión
        const ventaId = await historial.crearVenta(req.userId, detalles);
        res.status(201).json({ mensaje: 'Venta registrada', venta_id: ventaId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/historial/:venta_id/estado', ensureRole('admin'), async (req, res) => {
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

app.put('/api/ganancias/porcentaje', ensureRole('admin'), async (req, res) => {
    try {
        const { porcentaje } = req.body;
        const resultado = await ganancias.actualizarPorcentaje(porcentaje);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

////////////////////////
// RUTAS - DESCUENTOS
////////////////////////

// Obtener todos los descuentos (público o autenticado, según tu necesidad)
app.get('/api/descuentos', async (req, res) => {
    try {
        const allDescuentos = await descuentos.getAllDescuentos();
        res.json({ 
            success: true,
            data: allDescuentos
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Crear/actualizar/eliminar descuentos: solo admin
app.post('/api/descuentos', ensureRole('admin'), async (req, res) => {
    try {
        const result = await descuentos.createDescuento(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put('/api/descuentos/:id', ensureRole('admin'), async (req, res) => {
    try {
        const result = await descuentos.updateDescuento(req.params.id, req.body);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Eliminar descuento
app.delete('/api/descuentos/:id', ensureRole('admin'), async (req, res) => {
    try {
        await descuentos.deleteDescuento(req.params.id);
        res.json({ success: true, message: 'Descuento eliminado' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

////////////////////////
// CONFIGURACIÓN DEL SERVIDOR
////////////////////////
// Intentar iniciar servidor HTTPS (opcional)
try {
    if (fs.existsSync('key.pem') && fs.existsSync('cert.pem')) {
        const options = {
            key: fs.readFileSync('key.pem'),
            cert: fs.readFileSync('cert.pem')
        };
        
        https.createServer(options, app).listen(PORT, () => {
            console.log(`🔒 Servidor HTTPS ejecutándose en https://localhost:${PORT}`);
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
app.get('/api/users/:id/rut', ensureRole('admin'), async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Obtener el usuario con RUT desencriptado
        const user = await sesiones.getUserById(userId, true); // includeRut = true para desencriptar
        
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // Retornar el RUT ya desencriptado por el servicio
        res.json({ rut: user.rut });
    } catch (err) {
        console.error('Error al obtener RUT desencriptado:', err);
        res.status(500).json({ error: err.message });
    }
});

// (ya definidos arriba) ensureAuth, ensureRole, ensureOwnerOrAdmin
app.get('/api/admin/ping', ensureRole('admin'), (req, res) => {
    return res.status(200).json({ ok: true, role: req.session.auth.role });
});
