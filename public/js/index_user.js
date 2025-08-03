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

async function initializeApp() {
    try {
        // Verificar sesión existente
        checkUserSession();
        
        // Cargar datos iniciales
        await loadCategories();
        await loadProducts();
        await updateCartDisplay();
        
        // Iniciar actualización automática del carrito
        startCartAutoUpdate();
        
        console.log('Aplicación inicializada correctamente');
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
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

async function addToCart(productId) {
    if (!currentUser) {
        showNotification('Debes iniciar sesión para agregar productos al carrito', 'error');
        return;
    }
    
    try {
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
        
        if (response.ok) {
            await updateCartDisplay();
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

async function updateCartDisplay(silent = false) {
    if (!currentUser) {
        cartItems = [];
        // Verificar que los elementos del carrito existan antes de actualizar la UI
        if (document.getElementById('cart-count')) {
            updateCartUI();
        }
        return;
    }
    
    try {
        const response = await fetch(`/api/carrito/${currentUser.id}`);
        const newCartItems = await response.json();
        
        // Comparar si hay cambios en el carrito
        const hasChanges = JSON.stringify(cartItems) !== JSON.stringify(newCartItems);
        
        cartItems = newCartItems;
        
        // Verificar que los elementos del carrito existan antes de actualizar la UI
        if (document.getElementById('cart-count')) {
            updateCartUI();
        }
        
        // Mostrar notificación solo si hay cambios y no es actualización silenciosa
        if (hasChanges && !silent && cartItems.length > 0) {
            showNotification('Carrito actualizado', 'info');
        }
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        cartItems = [];
        // Verificar que los elementos del carrito existan antes de actualizar la UI
        if (document.getElementById('cart-count')) {
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartContent = document.getElementById('cart-content');
    const cartFooter = document.getElementById('cart-footer');
    const emptyCart = document.getElementById('empty-cart');
    const cartTotal = document.getElementById('cart-total');
    
    // Verificar que todos los elementos existan antes de continuar
    if (!cartCount || !cartContent || !cartFooter || !emptyCart || !cartTotal) {
        console.warn('Algunos elementos del carrito no están disponibles en el DOM');
        return;
    }
    
    // Actualizar contador
    const totalItems = cartItems.reduce((total, item) => total + item.cantidad, 0);
    
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.style.display = 'block';
    } else {
        cartCount.style.display = 'none';
    }
    
    // Actualizar contenido del carrito
    if (cartItems.length === 0) {
        emptyCart.style.display = 'block';
        cartFooter.style.display = 'none';
        cartContent.innerHTML = '';
    } else {
        emptyCart.style.display = 'none';
        cartFooter.style.display = 'block';
        
        const total = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        cartTotal.textContent = total.toFixed(2);
        
        cartContent.innerHTML = cartItems.map(item => {
            // Buscar el producto para obtener la imagen
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
            await updateCartDisplay();
        } else {
            showNotification('Error al actualizar cantidad', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        showNotification('Error de conexión', 'error');
    }
}

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
            await updateCartDisplay();
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

// Hacer funciones disponibles globalmente para onclick en HTML
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
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