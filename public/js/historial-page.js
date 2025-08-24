// ===========================
// HISTORIAL PAGE - Funcionalidades específicas para historial.html
// ===========================

let historialData = [];

// ===========================
// INICIALIZACIÓN
// ===========================

// Inicialización de la página de historial
document.addEventListener('DOMContentLoaded', function() {
    initializeHistorial();
    setupHistorialEventListeners();
});

// ===========================
// GESTIÓN DE SESIONES
// ===========================

function checkHistorialUserSession() {
    // Usar currentUser de header.js si existe
    if (window.currentUser) {
        updateHistorialUserInterface();
        return true;
    }
    
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        // Asignar a la variable global
        window.currentUser = JSON.parse(userData);
        updateHistorialUserInterface();
        return true;
    }
    return false;
}

function updateHistorialUserInterface() {
    const userNameElement = document.getElementById('user-name');
    if (window.currentUser && userNameElement) {
        userNameElement.textContent = `Hola, ${window.currentUser.username}`;
    }
}

function redirectToLogin() {
    alert('Debes iniciar sesión para ver tu historial');
    window.location.href = 'login.html';
}

// ===========================
// CARGA Y RENDERIZADO DE HISTORIAL
// ===========================

async function loadHistorial() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const emptyState = document.getElementById('empty-state');
    const historialCard = document.getElementById('historial-card');
    
    try {
        // Mostrar loading
        if (loading) loading.classList.remove('hidden');
        if (error) error.classList.add('hidden');
        if (emptyState) emptyState.classList.add('hidden');
        if (historialCard) historialCard.classList.add('hidden');
        
        // Hacer petición al API usando la variable global
        const response = await fetch(`/api/historial/${window.currentUser.id}`);
        
        if (!response.ok) {
            throw new Error('Error al cargar el historial');
        }
        
        historialData = await response.json();
        
        // Ocultar loading
        if (loading) loading.classList.add('hidden');
        
        if (historialData.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
        } else {
            if (historialCard) historialCard.classList.remove('hidden');
            renderHistorial();
        }
        
    } catch (err) {
        console.error('Error al cargar historial:', err);
        if (loading) loading.classList.add('hidden');
        showError(err.message);
    }
}

function renderHistorial(filteredData = null) {
    const tbody = document.getElementById('historial-tbody');
    if (!tbody) return;
    
    const data = filteredData || historialData;
    tbody.innerHTML = '';
    
    data.forEach(venta => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${venta.id}</td>
            <td>${formatDate(venta.fecha)}</td>
            <td>$${parseFloat(venta.total).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${venta.estado.toLowerCase()}">
                    ${capitalizeFirst(venta.estado)}
                </span>
            </td>
            <td>
                <button class="action-button" onclick="showDetails(${venta.id})">
                    <i class="fas fa-eye"></i> Ver detalles
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===========================
// MODAL DE DETALLES
// ===========================

function showDetails(ventaId) {
    const venta = historialData.find(v => v.id === ventaId);
    if (!venta) return;
    
    const modal = document.getElementById('details-modal');
    const modalBody = document.getElementById('modal-body');
    
    // Crear estructura correcta con clases CSS apropiadas
    modalBody.innerHTML = `
        <div class="detail-item">
            <span><strong>Pedido #${venta.id}</strong></span>
        </div>
        <div class="detail-item">
            <span>Fecha:</span>
            <span>${formatDate(venta.fecha)}</span>
        </div>
        <div class="detail-item">
            <span>Estado:</span>
            <span class="status-badge status-${venta.estado.toLowerCase()}">
                ${capitalizeFirst(venta.estado)}
            </span>
        </div>
        ${venta.payment_id ? `
        <div class="detail-item">
            <span>ID de Pago:</span>
            <span>${venta.payment_id}</span>
        </div>` : ''}
        <div class="detail-item">
            <span><strong>Productos:</strong></span>
        </div>
        ${venta.detalles.map(detalle => `
            <div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 1rem; width: 100%;">
                    <img src="${detalle.imagen_url || 'https://via.placeholder.com/60x60/cccccc/666666?text=Sin+Imagen'}" 
                         alt="${detalle.producto}" 
                         style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                         onerror="this.src='https://via.placeholder.com/60x60/cccccc/666666?text=Sin+Imagen'">
                    <div style="flex: 1;">
                        <h5 style="margin: 0; font-weight: 600;">${detalle.producto}</h5>
                        <p style="margin: 0.25rem 0; color: #6b7280;">Cantidad: ${detalle.cantidad}</p>
                        <p style="margin: 0.25rem 0; color: #6b7280;">Precio unitario: $${parseFloat(detalle.precio_unitario).toFixed(2)}</p>
                        ${detalle.descuento > 0 ? `<p style="margin: 0.25rem 0; color: #dc2626;">Descuento: ${detalle.descuento}%</p>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <strong>$${parseFloat(detalle.subtotal).toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        `).join('')}
        <div class="detail-item" style="font-size: 1.2rem; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 1rem;">
            <span>Total:</span>
            <span>$${parseFloat(venta.total).toFixed(2)}</span>
        </div>
    `;
    
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('details-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// ===========================
// UTILIDADES
// ===========================

function showError(message) {
    const error = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    if (error && errorMessage) {
        errorMessage.textContent = message;
        error.classList.remove('hidden');
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function filterByEstado() {
    const filter = document.getElementById('estado-filter');
    if (!filter) return;
    
    const selectedEstado = filter.value;
    
    if (selectedEstado === '') {
        renderHistorial();
    } else {
        const filteredData = historialData.filter(venta => 
            venta.estado.toLowerCase() === selectedEstado.toLowerCase()
        );
        renderHistorial(filteredData);
    }
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupHistorialEventListeners() {
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
    if (window.currentUser) {
    }
}

// ===========================
// FUNCIONES GLOBALES
// ===========================

// Exponer funciones globales necesarias
window.showDetails = showDetails;
window.closeModal = closeModal;
window.loadHistorial = loadHistorial;

// ===========================
// INICIALIZACIÓN
// ===========================

function initializeHistorial() {
    checkHistorialUserSession();
    setupHistorialEventListeners();
    loadHistorial();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHistorial);
} else {
    initializeHistorial();
}