// Estado global de la aplicación
let currentUser = null;
let cartItems = [];
let products = [];
let categories = [];
let cartUpdateInterval = null; // Nuevo: intervalo para actualización automática

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Modificar la función initializeApp (alrededor de la línea 14)
async function initializeApp() {
    try {
        checkUserSession();
        updateUserInterface();
        
        await loadCategories();
        await loadProducts();
        
        // ✅ CARGAR CARRITO AL INICIO SI HAY USUARIO
        if (currentUser) {
            await refreshCartFromAPI();
        }
        
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la aplicación:', error);
        showNotification('Error al cargar la aplicación', 'error');
    }
}

// ========================
// GESTIÓN DE SESIONES
// ========================

function checkUserSession() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        updateUserInterface();
    }
}

function updateUserInterface() {
    const dropdownGuest = document.getElementById('dropdown-guest');
    const dropdownUser = document.getElementById('dropdown-user');
    const userNameElement = document.getElementById('dropdown-user-name');
    const userEmailElement = document.getElementById('dropdown-user-email');
    
    if (currentUser) {
        dropdownGuest.classList.add('hidden');
        dropdownUser.classList.remove('hidden');
        userNameElement.textContent = currentUser.username;
        userEmailElement.textContent = currentUser.email || '';
    } else {
        dropdownGuest.classList.remove('hidden');
        dropdownUser.classList.add('hidden');
    }
}

async function login(username, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const userData = await response.json();
            currentUser = userData;
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Reiniciar actualización automática del carrito
            startCartAutoUpdate();
            
            updateUserInterface();
            await updateCartDisplay();
            showNotification('Inicio de sesión exitoso', 'success');
            return true;
        } else {
            const error = await response.json();
            showNotification(error.error || 'Credenciales incorrectas', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error en login:', error);
        showNotification('Error de conexión', 'error');
        return false;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    cartItems = [];
    
    // Detener actualización automática del carrito
    stopCartAutoUpdate();
    
    updateUserInterface();
    updateCartUI();
    showNotification('Sesión cerrada correctamente', 'success');
}

// ========================
// GESTIÓN DE PRODUCTOS
// ========================

async function loadCategories() {
    try {
        const response = await fetch('/api/categorias');
        categories = await response.json();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        throw error;
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/Productos');
        products = await response.json();
        await renderProducts();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        throw error;
    }
}

async function renderProducts() {
    const productsGrid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">No hay productos disponibles</p>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.imagen_url || 'https://via.placeholder.com/200x250/4a90e2/ffffff?text=' + encodeURIComponent(product.nombre)}" 
                     alt="${product.nombre}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/200x250/cccccc/666666?text=Sin+Imagen'">
            </div>
            <h3 class="product-name">${product.nombre}</h3>
            <p class="product-description">${product.descripcion || ''}</p>
            <div class="product-pricing">
                <span class="current-price">$${parseFloat(product.precio).toFixed(2)}</span>
            </div>
            <button class="add-button" onclick="addToCart(${product.id})">
                <i class="fas fa-shopping-cart"></i>
                Agregar al Carrito
            </button>
        </div>
    `).join('');
}

// ========================
// GESTIÓN DEL CARRITO
// ========================

// Reemplazar la función addToCart existente (líneas 167-190 aproximadamente)
async function addToCart(productId) {
    console.log('=== INICIANDO addToCart ===' + productId);
    
    if (!currentUser) {
        showNotification('Debes iniciar sesión para agregar productos al carrito', 'error');
        return;
    }
    
    try {
        console.log('Enviando petición POST...');
        const response = await fetch('/api/carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                producto_id: productId,
                cantidad: 1
            })
        });
        
        console.log('Respuesta recibida:', response.status);
        
        if (response.ok) {
            console.log('Producto agregado, actualizando vista...');
            
            // ✅ FORZAR ACTUALIZACIÓN INMEDIATA Y SIMPLE
            setTimeout(async () => {
                await forceUpdateCart();
            }, 100);
            
            showNotification('Producto agregado al carrito', 'success');
        } else {
            const error = await response.json();
            showNotification(error.error || 'Error al agregar producto', 'error');
        }
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        showNotification('Error de conexión', 'error');
    }
}

// Reemplazar la función updateCartDisplay existente
async function updateCartDisplay(silent = false) {
    console.log('Actualizando carrito display...');
    
    if (!currentUser) {
        console.log('No hay usuario logueado');
        cartItems = [];
        if (document.getElementById('cart-count')) {
            updateCartUI();
        }
        return;
    }
    
    try {
        console.log('Obteniendo carrito del usuario:', currentUser.id);
        const response = await fetch(`/api/carrito/${currentUser.id}`);
        const newCartItems = await response.json();
        
        console.log('Nuevos items del carrito:', newCartItems);
        
        cartItems = newCartItems;
        
        // ✅ SIEMPRE ACTUALIZAR LA UI
        updateCartUI();
        
        if (!silent) {
            console.log('Carrito actualizado exitosamente');
        }
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        cartItems = [];
        if (document.getElementById('cart-count')) {
            updateCartUI();
        }
    }
}

// Reemplazar la función updateCartUI existente
function updateCartUI() {
    console.log('Actualizando UI con items:', cartItems);
    
    // ✅ ACTUALIZAR CONTADOR
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = cartItems.reduce((total, item) => total + parseInt(item.cantidad), 0);
        
        if (totalItems > 0) {
            cartCount.textContent = totalItems;
            cartCount.style.display = 'block';
        } else {
            cartCount.style.display = 'none';
        }
    }
    
    // ✅ ACTUALIZAR CONTENIDO DEL CARRITO
    const cartContent = document.getElementById('cart-content');
    const cartFooter = document.getElementById('cart-footer');
    const emptyCart = document.getElementById('empty-cart');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartContent && cartFooter && emptyCart && cartTotal) {
        if (cartItems.length === 0) {
            emptyCart.style.display = 'block';
            cartFooter.style.display = 'none';
            cartContent.innerHTML = '';
        } else {
            emptyCart.style.display = 'none';
            cartFooter.style.display = 'block';
            
            // Calcular total
            const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.precio) * parseInt(item.cantidad)), 0);
            cartTotal.textContent = total.toFixed(2);
            
            // Renderizar items
            cartContent.innerHTML = cartItems.map(item => {
                const product = products.find(p => p.id === item.producto_id);
                const imageUrl = product?.imagen_url || `https://via.placeholder.com/60x60/cccccc/666666?text=${encodeURIComponent(item.nombre.substring(0, 3))}`;
                
                return `
                    <div class="cart-item" data-product-id="${item.producto_id}">
                        <div class="cart-item-image">
                            <img src="${imageUrl}" 
                                 alt="${item.nombre}" 
                                 onerror="this.src='https://via.placeholder.com/60x60/cccccc/666666?text=Sin+Imagen'">
                        </div>
                        <div class="cart-item-info">
                            <h4>${item.nombre}</h4>
                            <p class="cart-item-price">$${parseFloat(item.precio).toFixed(2)}</p>
                        </div>
                        <div class="cart-item-controls">
                            <button class="quantity-btn" onclick="updateCartQuantity(${item.producto_id}, ${item.cantidad - 1})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.cantidad}</span>
                            <button class="quantity-btn" onclick="updateCartQuantity(${item.producto_id}, ${item.cantidad + 1})">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="remove-btn" onclick="removeFromCart(${item.producto_id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// Reemplazar la función updateCartQuantity existente
// Reemplazar updateCartQuantity
async function updateCartQuantity(productId, newQuantity) {
    if (!currentUser) {
        showNotification('Debes iniciar sesión para modificar el carrito', 'error');
        return;
    }
    
    if (newQuantity <= 0) {
        await removeFromCart(productId);
        return;
    }
    
    try {
        const response = await fetch('/api/carrito', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                producto_id: productId,
                cantidad: newQuantity
            })
        });
        
        if (response.ok) {
            await forceUpdateCart();
        } else {
            showNotification('Error al actualizar cantidad', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        showNotification('Error de conexión', 'error');
    }
}

// Reemplazar removeFromCart
async function removeFromCart(productId) {
    if (!currentUser) {
        showNotification('Debes iniciar sesión para modificar el carrito', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/carrito', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                producto_id: productId
            })
        });
        
        if (response.ok) {
            await forceUpdateCart();
            showNotification('Producto eliminado del carrito', 'success');
        } else {
            showNotification('Error al eliminar producto', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        showNotification('Error de conexión', 'error');
    }
}

// ========================
// INTERFAZ DE USUARIO
// ========================

function setupEventListeners() {
    // Botón de usuario
    const userBtn = document.getElementById('user-btn');
    if (userBtn) {
        userBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleUserDropdown();
        });
    }
    
    // Botón de carrito
    const cartBtn = document.getElementById('cart-btn');
    cartBtn.addEventListener('click', toggleCartSidebar);
    
    // Cerrar carrito
    const closeCart = document.getElementById('close-cart');
    closeCart.addEventListener('click', closeCartSidebar);
    
    // Overlays
    const dropdownOverlay = document.getElementById('dropdown-overlay');
    dropdownOverlay.addEventListener('click', closeUserDropdown);
    
    const cartOverlay = document.getElementById('cart-overlay');
    cartOverlay.addEventListener('click', closeCartSidebar);
    
    // Botones de sesión
    const loginBtn = document.getElementById('login-btn');
    loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
    
    const registerBtn = document.getElementById('register-btn');
    registerBtn.addEventListener('click', () => {
        window.location.href = 'registro.html';
    });
    
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', logout);
    
    // Botones del dropdown de usuario logueado
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showNotification('Función Mi Perfil en desarrollo', 'info');
            closeUserDropdown();
        });
    }
    
    // ...
    // Botón de pedidos
    const ordersBtn = document.getElementById('orders-btn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', function() {
            if (currentUser) {
                window.location.href = 'historial.html';
            } else {
                showNotification('Debes iniciar sesión para ver tu historial', 'warning');
            }
        });
    }
    
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            showNotification('Función Lista de Deseos en desarrollo', 'info');
            closeUserDropdown();
        });
    }
    
    // Carrusel de productos
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    
    if (prevBtn) prevBtn.addEventListener('click', () => scrollProducts('left'));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollProducts('right'));
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    const overlay = document.getElementById('dropdown-overlay');
    
    if (!dropdown || !overlay) {
        console.error('Elementos del dropdown no encontrados');
        return;
    }
    
    const isActive = dropdown.classList.contains('active');
    
    if (isActive) {
        closeUserDropdown();
    } else {
        // Cerrar otros dropdowns/modales primero
        closeCartSidebar();
        
        dropdown.classList.add('active');
        overlay.classList.add('active');
        
        console.log('Dropdown abierto');
    }
}

function closeUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    const overlay = document.getElementById('dropdown-overlay');
    
    if (dropdown && overlay) {
        dropdown.classList.remove('active');
        overlay.classList.remove('active');
        
        console.log('Dropdown cerrado');
    }
}

function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function closeCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

function scrollProducts(direction) {
    const container = document.getElementById('products-grid');
    const scrollAmount = 300;
    
    if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    messageElement.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ========================
// FUNCIONES GLOBALES
// ========================

// Al final del archivo, asegúrate de que estas líneas estén presentes:
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.refreshCartFromAPI = refreshCartFromAPI;
window.updateCartUI = updateCartUI;
window.login = login;
window.logout = logout;

// Nueva función para iniciar actualización automática
function startCartAutoUpdate() {
    // Limpiar intervalo existente si hay uno
    if (cartUpdateInterval) {
        clearInterval(cartUpdateInterval);
    }
    
    // Actualizar carrito cada 30 segundos si hay usuario logueado
    cartUpdateInterval = setInterval(async () => {
        if (currentUser) {
            await updateCartDisplay(true); // true indica actualización silenciosa
        }
    }, 30000); // 30 segundos
}

// Nueva función para detener actualización automática
function stopCartAutoUpdate() {
    if (cartUpdateInterval) {
        clearInterval(cartUpdateInterval);
        cartUpdateInterval = null;
    }
}

// Agregar esta nueva función
async function forceUpdateCart() {
    console.log('=== FORZANDO ACTUALIZACIÓN DEL CARRITO ===');
    
    if (!currentUser) {
        console.log('No hay usuario logueado');
        return;
    }
    
    try {
        console.log('Consultando API del carrito...');
        const response = await fetch(`/api/carrito/${currentUser.id}`);
        const items = await response.json();
        
        console.log('Items recibidos de la API:', items);
        
        // ✅ ACTUALIZAR VARIABLE GLOBAL
        cartItems = items;
        
        // ✅ ACTUALIZAR CONTADOR MANUALMENTE
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = items.reduce((total, item) => total + parseInt(item.cantidad), 0);
            console.log('Total de items calculado:', totalItems);
            
            if (totalItems > 0) {
                cartCount.textContent = totalItems;
                cartCount.style.display = 'block';
                console.log('Contador actualizado a:', totalItems);
            } else {
                cartCount.style.display = 'none';
                console.log('Carrito vacío, ocultando contador');
            }
        }
        
        // ✅ ACTUALIZAR CONTENIDO DEL SIDEBAR
        updateCartSidebar(items);
        
    } catch (error) {
        console.error('Error al forzar actualización:', error);
    }
}

function animateCartCounter() {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) return;
    
    // ✅ ANIMACIÓN DE PULSO
    cartCount.style.transform = 'scale(1.3)';
    cartCount.style.backgroundColor = '#ff4757';
    
    setTimeout(() => {
        cartCount.style.transform = 'scale(1)';
        cartCount.style.backgroundColor = '';
    }, 300);
}

// ✅ HACER LA FUNCIÓN DISPONIBLE GLOBALMENTE
// Agregar esta nueva función
function updateCartSidebar(items) {
    console.log('=== ACTUALIZANDO SIDEBAR ===');
    console.log('Items para sidebar:', items);
    
    const cartContent = document.getElementById('cart-content');
    const cartFooter = document.getElementById('cart-footer');
    const emptyCart = document.getElementById('empty-cart');
    const cartTotal = document.getElementById('cart-total');
    
    console.log('Elementos encontrados:', {
        cartContent: !!cartContent,
        cartFooter: !!cartFooter,
        emptyCart: !!emptyCart,
        cartTotal: !!cartTotal
    });
    
    if (!cartContent) {
        console.error('cart-content no encontrado!');
        return;
    }
    
    if (items.length === 0) {
        console.log('Carrito vacío, mostrando mensaje');
        if (emptyCart) emptyCart.style.display = 'block';
        if (cartFooter) cartFooter.style.display = 'none';
        cartContent.innerHTML = '';
    } else {
        console.log('Carrito con items, renderizando...');
        if (emptyCart) emptyCart.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'block';
        
        // ✅ CALCULAR TOTAL
        const total = items.reduce((sum, item) => sum + (parseFloat(item.precio) * parseInt(item.cantidad)), 0);
        if (cartTotal) cartTotal.textContent = total.toFixed(2);
        
        // ✅ RENDERIZAR ITEMS UNO POR UNO
        cartContent.innerHTML = '';
        
        items.forEach(item => {
            console.log('Renderizando item:', item.nombre);
            
            const cartItemDiv = document.createElement('div');
            cartItemDiv.className = 'cart-item';
            cartItemDiv.setAttribute('data-product-id', item.producto_id);
            
            const product = products.find(p => p.id === item.producto_id);
            const imageUrl = product?.imagen_url || `https://via.placeholder.com/60x60/cccccc/666666?text=${encodeURIComponent(item.nombre.substring(0, 3))}`;
            
            cartItemDiv.innerHTML = `
                <div class="cart-item-image">
                    <img src="${imageUrl}" 
                         alt="${item.nombre}" 
                         onerror="this.src='https://via.placeholder.com/60x60/cccccc/666666?text=Sin+Imagen'">
                </div>
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    <p class="cart-item-price">$${parseFloat(item.precio).toFixed(2)}</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.producto_id}, ${item.cantidad - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity">${item.cantidad}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.producto_id}, ${item.cantidad + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="remove-btn" onclick="removeFromCart(${item.producto_id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            cartContent.appendChild(cartItemDiv);
        });
        
        console.log('Items renderizados en el sidebar');
    }
}