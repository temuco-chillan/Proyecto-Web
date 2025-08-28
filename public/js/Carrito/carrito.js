const carritoApiUrl = window.location.hostname.includes('localhost')
    ? 'http://localhost:3000/api/carrito'
    : '/api/carrito';

// Obtener cuenta activa desde localStorage
function getAccount() {
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
        console.warn('No hay usuario en sesión.');
        return null;
    }
    return JSON.parse(stored);
}

// === Obtener y mostrar carrito ===
// Reemplazar la función fetchCarritoPage (líneas 15-42)
// Modificar la función fetchCarritoPage (línea 17)
// Mejorar la función fetchCarritoPage para manejar mejor el sidebar
function fetchCarritoPage() {
    const user = getAccount();
    if (!user) return;

    fetch(`${carritoApiUrl}/${user.id}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('carritoList');
            const cartContent = document.getElementById('cart-content');
            
            if (tableBody) {
                renderCarritoTable(data, tableBody);
            } else if (cartContent) {
                renderCartSidebar(data);
            }
        })
        .catch(error => {
            console.error('Error al cargar carrito:', error);
        });
}

// Agregar función específica para renderizar el sidebar
// Modificar renderCartSidebar para buscar ambos IDs
function renderCartSidebar(cartData) {
    const cartContent = document.getElementById('cart-content');
    // Buscar ambos IDs para compatibilidad
    const cartCounter = document.getElementById('cart-count') || document.getElementById('cart-counter');
    const cartFooter = document.getElementById('cart-footer');
    
    if (!cartContent) return;

    if (!cartData.items || cartData.items.length === 0) {
        cartContent.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Tu carrito está vacío</p>
            </div>
        `;
        if (cartCounter) {
            cartCounter.textContent = '0';
            cartCounter.style.display = 'none';
        }
        if (cartFooter) cartFooter.style.display = 'none';
        return;
    }

    let cartHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    cartData.items.forEach(item => {
        const itemTotal = item.precio * item.cantidad;
        const discountedPrice = item.descuento > 0 ? 
            itemTotal * (1 - item.descuento / 100) : itemTotal;
        
        totalItems += item.cantidad;
        totalPrice += discountedPrice;

        cartHTML += `
            <div class="cart-item" data-product-id="${item.producto_id}">
                <div class="cart-item-image">
                    <img src="${item.imagen_url || 'https://via.placeholder.com/60x60/cccccc/666666?text=Sin+Imagen'}" 
                         alt="${item.nombre}"
                         onerror="this.src='https://via.placeholder.com/60x60/cccccc/666666?text=Sin+Imagen'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.nombre}</div>
                    <div class="cart-item-price">
                        $${item.precio.toFixed(2)}
                        ${item.descuento > 0 ? `<span class="discount">(-${item.descuento}%)</span>` : ''}
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateCantidadPage(${item.producto_id}, ${item.cantidad - 1})" 
                                ${item.cantidad <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.cantidad}</span>
                        <button class="quantity-btn" onclick="updateCantidadPage(${item.producto_id}, ${item.cantidad + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                <button class="remove-item" onclick="removeFromCarritoPage(${item.producto_id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });

    cartContent.innerHTML = cartHTML;
    
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
    }

    if (cartFooter) {
        const cartTotalSpan = document.getElementById('cart-total');
        if (cartTotalSpan) {
            cartTotalSpan.textContent = totalPrice.toFixed(2);
        }
        cartFooter.style.display = 'block';
    }
}

// Agregar función para renderizar tabla
function renderCarritoTable(data, tableBody) {
    tableBody.innerHTML = '';
    
    data.forEach(item => {
        const total = item.precio * item.cantidad;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.cantidad}</td>
            <td>${item.nombre || 'Desconocido'}</td>
            <td>${item.precio ? `$${total.toFixed(2)}` : '-'}</td>
            <td>
                <input type="number" min="1" value="${item.cantidad}" onchange="updateCantidadPage(${item.producto_id}, this.value)">
                <button class="btn" onclick="removeFromCarritoPage(${item.producto_id})">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// === Agregar producto al carrito ===
function addToCarritoPage(producto_id, cantidad = 1) {  // ✅ RENOMBRADO
    const user = getAccount();
    if (!user) return;

    fetch(carritoApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id, producto_id, cantidad })
    })
        .then(res => res.json())
        .then(data => {
            alert('🛒 Producto agregado al carrito');
            fetchCarritoPage();  // ✅ ACTUALIZADO
        })
        .catch(error => console.error('❌ Error al agregar producto al carrito:', error));
}

// === Actualizar cantidad ===
function updateCantidadPage(producto_id, cantidad) {  // ✅ RENOMBRADO
    const user = getAccount();
    if (!user) return;

    fetch(carritoApiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id, producto_id, cantidad })
    })
        .then(res => res.json())
        .then(() => {
            console.log('✅ Cantidad actualizada');
            fetchCarritoPage();  // ✅ ACTUALIZADO
        })
        .catch(error => console.error('❌ Error al actualizar cantidad:', error));
}

// === Eliminar producto del carrito ===
function removeFromCarritoPage(producto_id) {  // ✅ RENOMBRADO
    const user = getAccount();
    if (!user) return;

    if (!confirm('¿Eliminar este producto del carrito?')) return;

    fetch(carritoApiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id, producto_id })
    })
        .then(res => res.json())
        .then(() => {
            alert('🗑️ Producto eliminado del carrito');
            fetchCarritoPage();  // ✅ ACTUALIZADO
        })
        .catch(error => console.error('❌ Error al eliminar producto:', error));
}

// === Vaciar carrito completo ===
function vaciarCarritoPage() {  // ✅ RENOMBRADO
    const user = getAccount();
    if (!user) return;

    if (!confirm('¿Vaciar todo el carrito?')) return;

    fetch(`${carritoApiUrl}/usuario/${user.id}`, {
        method: 'DELETE'
    })
        .then(res => res.json())
        .then(() => {
            alert('🧹 Carrito vaciado');
            fetchCarritoPage();  // ✅ ACTUALIZADO
        })
        .catch(error => console.error('❌ Error al vaciar carrito:', error));
}

// === Enviar carrito a backend y redirigir a Mercado Pago ===
function pagarCarrito() {
    const user = getAccount();
    if (!user) return;

    fetch('/api/pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: user.id })
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errorData => {
                    throw new Error(errorData.error || 'Error desconocido');
                });
            }
            return res.json();
        })
        .then(data => {
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                showStockWarning('Error al generar el link de pago', 'Error de procesamiento');
            }
        })
        .catch(error => {
            console.error('❌ Error al procesar pago:', error);

            // Verificar si es un error de stock
            if (error.message.includes('Stock insuficiente')) {
                showStockWarning(error.message, 'Stock Insuficiente');
            } else {
                showStockWarning('Error al procesar el pago. Intenta nuevamente.', 'Error de Conexión');
            }
        });
}


// === Función para mostrar icono de stock insuficiente ===
function showStockWarning(message, title = 'Stock Insuficiente') {
    // Usar el sistema de notificaciones existente
    showNotification(message, 'warning');
}

// === Función para cerrar advertencia (ya no necesaria) ===
// function closeStockWarning() {
//     const overlay = document.getElementById('stock-warning-overlay');
//     const modal = document.getElementById('stock-warning-modal');
//     if (overlay) overlay.remove();
//     if (modal) modal.remove();
// }

// === Cargar carrito al iniciar ===
fetchCarritoPage();  // ✅ ACTUALIZADO

// === Función de notificación (si no está disponible globalmente) ===
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    if (notification && messageElement) {
        messageElement.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    } else {
        // Fallback si no existe el elemento de notificación
        alert(message);
    }
}
