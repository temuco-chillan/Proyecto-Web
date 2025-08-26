let historialData = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeHistorial();
    setupEventListeners();
});

function initializeHistorial() {
    try {
        // Verificar sesión activa usando la variable global
        if (!checkUserSession()) {
            redirectToLogin();
            return;
        }
        
        // Cargar historial del usuario
        loadHistorial();
        
    } catch (error) {
        console.error('Error al inicializar historial:', error);
        showError('Error al cargar la página');
    }
}

function checkUserSession() {
    // Usar currentUser de index_user.js si existe
    if (window.currentUser) {
        // No redeclarar, usar la variable global
        updateUserInterface();
        return true;
    }
    
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        // Asignar a la variable global en lugar de crear una local
        window.currentUser = JSON.parse(userData);
        updateUserInterface();
        return true;
    }
    return false;
}

function updateUserInterface() {
    const userNameElement = document.getElementById('user-name');
    if (window.currentUser && userNameElement) {
        userNameElement.textContent = `Hola, ${window.currentUser.username}`;
    }
}

function redirectToLogin() {
    alert('Debes iniciar sesión para ver tu historial');
    window.location.href = 'login.html';
}

async function loadHistorial() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const emptyState = document.getElementById('empty-state');
    const historialCard = document.getElementById('historial-card');
    
    try {
        // Mostrar loading
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        emptyState.classList.add('hidden');
        historialCard.classList.add('hidden');
        
        // Hacer petición al API usando la variable global
        const response = await fetch(`/api/historial/${window.currentUser.id}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el historial');
        }
        
        historialData = await response.json();
        
        // Ocultar loading
        loading.classList.add('hidden');
        
        if (historialData.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            historialCard.classList.remove('hidden');
            renderHistorial();
        }
        
    } catch (err) {
        console.error('Error al cargar historial:', err);
        loading.classList.add('hidden');
        showError(err.message);
    }
}

function renderHistorial(filteredData = null) {
    const tbody = document.getElementById('historial-tbody');
    const data = filteredData || historialData;
    
    tbody.innerHTML = '';
    
    data.forEach(venta => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        const fecha = new Date(venta.fecha).toLocaleDateString('es-ES');
        
        // Formatear total
        const total = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(venta.total || 0);
        
        row.innerHTML = `
            <td class="font-medium">#${venta.id}</td>
            <td>${fecha}</td>
            <td>${total}</td>
            <td>
                <span class="status-badge status-${venta.estado}">
                    ${capitalizeFirst(venta.estado)}
                </span>
            </td>
            <td class="text-right">
                <button class="action-button" onclick="showDetails(${venta.id})">
                    Ver Detalles
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function showDetails(ventaId) {
    const venta = historialData.find(v => v.id === ventaId);
    if (!venta) return;
    
    const modal = document.getElementById('details-modal');
    const modalBody = document.getElementById('modal-body');
    
    // Formatear fecha
    const fecha = new Date(venta.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Formatear total
    const total = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(venta.total || 0);
    
    let detallesHTML = `
        <div class="detail-item">
            <span><strong>ID de Venta:</strong></span>
            <span>#${venta.id}</span>
        </div>
        <div class="detail-item">
            <span><strong>Fecha:</strong></span>
            <span>${fecha}</span>
        </div>
        <div class="detail-item">
            <span><strong>Estado:</strong></span>
            <span class="status-badge status-${venta.estado}">
                ${capitalizeFirst(venta.estado)}
            </span>
        </div>
        <hr style="margin: 1rem 0;">
        <h4 style="margin-bottom: 1rem;">Productos:</h4>
    `;
    
    // Agregar detalles de productos
    if (venta.detalles && venta.detalles.length > 0) {
        venta.detalles.forEach(detalle => {
            const subtotal = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
            }).format(detalle.subtotal || (detalle.cantidad * detalle.precio_unitario));
            
            const precioUnitario = new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP'
            }).format(detalle.precio_unitario || 0);
            
            detallesHTML += `
                <div class="detail-item">
                    <span>${detalle.producto} (x${detalle.cantidad})</span>
                    <span>${precioUnitario} c/u = ${subtotal}</span>
                </div>
            `;
        });
    }
    
    detallesHTML += `
        <hr style="margin: 1rem 0;">
        <div class="detail-item">
            <span><strong>Total:</strong></span>
            <span><strong>${total}</strong></span>
        </div>
    `;
    
    modalBody.innerHTML = detallesHTML;
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('details-modal');
    modal.classList.add('hidden');
}

function showError(message) {
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = message;
    error.classList.remove('hidden');
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function filterByEstado() {
    const filter = document.getElementById('estado-filter').value;
    
    if (filter === '') {
        renderHistorial();
    } else {
        const filtered = historialData.filter(venta => venta.estado === filter);
        renderHistorial(filtered);
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Modal close
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Modal background click
    const modal = document.getElementById('details-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Filter
    const estadoFilter = document.getElementById('estado-filter');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', filterByEstado);
    }
    
    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadHistorial);
    }
}

// Exponer funciones globales
window.showDetails = showDetails;
window.closeModal = closeModal;