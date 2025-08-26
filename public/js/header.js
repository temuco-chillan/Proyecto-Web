// ========================
// HEADER FUNCTIONALITY
// ========================

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Función para cerrar el dropdown de usuario
function closeUserDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    const overlay = document.getElementById('dropdown-overlay');
    
    if (dropdown && overlay) {
        dropdown.classList.remove('active');
        overlay.classList.remove('active');
        console.log('Dropdown cerrado');
    }
}

// Función para alternar el dropdown de usuario
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

// Función para cerrar el sidebar del carrito
function closeCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        console.log('Cart sidebar cerrado');
    }
}

// Función para alternar el sidebar del carrito
function toggleCartSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    
    if (!sidebar || !overlay) {
        console.error('Elementos del carrito no encontrados');
        return;
    }
    
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    console.log('Cart sidebar toggled:', sidebar.classList.contains('active'));
}

// Función para hacer logout
function logout() {
    // Acceder a currentUser desde window si está disponible
    if (window.currentUser) {
        window.currentUser = null;
    }
    localStorage.removeItem('currentUser');
    
    // Limpiar carrito
    if (window.cartItems) {
        window.cartItems = [];
    }
    
    // Detener actualización automática del carrito si existe
    if (window.stopCartAutoUpdate) {
        window.stopCartAutoUpdate();
    }
    
    // Actualizar interfaz si la función existe
    if (window.updateUserInterface) {
        window.updateUserInterface();
    }
    
    // Actualizar display del carrito si la función existe
    if (window.updateCartDisplay) {
        window.updateCartDisplay();
    }
    
    showNotification('Sesión cerrada exitosamente', 'success');
    
    // Redirigir a login después de un breve delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Función para configurar todos los event listeners del header
function setupHeaderEventListeners() {
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
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleCartSidebar();
        });
    }
    
    // Cerrar carrito
    const closeCart = document.getElementById('close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartSidebar);
    }
    
    // Overlay del dropdown
    const dropdownOverlay = document.getElementById('dropdown-overlay');
    if (dropdownOverlay) {
        dropdownOverlay.addEventListener('click', function(e) {
            if (e.target === dropdownOverlay) {
                closeUserDropdown();
            }
        });
    }
    
    // Evento de clic en documento para cerrar dropdown
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('user-dropdown');
        const userBtn = document.getElementById('user-btn');
        
        if (dropdown && userBtn && !dropdown.contains(e.target) && !userBtn.contains(e.target)) {
            closeUserDropdown();
        }
    });
    
    // Overlay del carrito
    const cartOverlay = document.getElementById('cart-overlay');
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }
    
    // Botones de sesión
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }
    
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            window.location.href = 'registro.html';
        });
    }
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Botones del dropdown de usuario logueado
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            showNotification('Función Mi Perfil en desarrollo', 'info');
            closeUserDropdown();
        });
    }
    
    const ordersBtn = document.getElementById('orders-btn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', function() {
            const currentUser = window.currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
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
}

// Función para actualizar la interfaz de usuario del header
function updateHeaderUserInterface() {
    const dropdownGuest = document.getElementById('dropdown-guest');
    const dropdownUser = document.getElementById('dropdown-user');
    const userNameElement = document.getElementById('dropdown-user-name');
    const userEmailElement = document.getElementById('dropdown-user-email');
    
    const currentUser = window.currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (currentUser && dropdownGuest && dropdownUser) {
        dropdownGuest.classList.add('hidden');
        dropdownUser.classList.remove('hidden');
        if (userNameElement) userNameElement.textContent = currentUser.username;
        if (userEmailElement) userEmailElement.textContent = currentUser.email || '';
    } else if (dropdownGuest && dropdownUser) {
        dropdownGuest.classList.remove('hidden');
        dropdownUser.classList.add('hidden');
    }
}

// Inicializar header cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    setupHeaderEventListeners();
    updateHeaderUserInterface();
    console.log('✅ Header inicializado correctamente');
});

// Exponer funciones globalmente para que otros scripts puedan usarlas
window.toggleUserDropdown = toggleUserDropdown;
window.closeUserDropdown = closeUserDropdown;
window.toggleCartSidebar = toggleCartSidebar;
window.closeCartSidebar = closeCartSidebar;
window.showNotification = showNotification;
window.logout = logout;
window.updateHeaderUserInterface = updateHeaderUserInterface;