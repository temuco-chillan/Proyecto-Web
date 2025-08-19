// Función para obtener parámetros de la URL
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        orderId: params.get('order_id'),
        userId: params.get('user_id'),
        paymentId: params.get('payment_id'),
        subtotal: params.get('subtotal'),
        items: params.get('items'),
        reason: params.get('reason')
    };
}

// Función para formatear moneda
function formatCurrency(amount) {
    if (!amount && amount !== 0) return '$0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '$0.00';
    
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numAmount);
}

// ✅ FUNCIÓN SIMPLIFICADA PARA ACTUALIZAR SOLO SUBTOTAL
function updateTotals(params) {
    console.log('Actualizando solo subtotal:', params.subtotal);
    
    const subtotal = parseFloat(params.subtotal) || 0;
    
    // ✅ SOLO ACTUALIZAR SUBTOTAL - OCULTAR ENVÍO E IMPUESTOS
    const subtotalElements = document.querySelectorAll('.total-row:nth-child(1) span:last-child');
    subtotalElements.forEach(element => {
        element.textContent = formatCurrency(subtotal);
    });
    
    // ✅ OCULTAR FILAS DE ENVÍO E IMPUESTOS
    const envioRow = document.querySelector('.total-row:nth-child(2)');
    const impuestosRow = document.querySelector('.total-row:nth-child(3)');
    
    if (envioRow) envioRow.style.display = 'none';
    if (impuestosRow) impuestosRow.style.display = 'none';
    
    // ✅ EL TOTAL FINAL ES IGUAL AL SUBTOTAL POR AHORA
    const totalElements = document.querySelectorAll('.total-final span:last-child');
    totalElements.forEach(element => {
        element.textContent = formatCurrency(subtotal);
    });
    
    // ✅ CAMBIAR ETIQUETA DEL TOTAL
    const totalLabel = document.querySelector('.total-final span:first-child');
    if (totalLabel) {
        totalLabel.textContent = 'Total:';
    }
}

// Función para actualizar la lista de productos
function updateItemList(items) {
    const itemListElement = document.querySelector('.item-list');
    if (!itemListElement || !items || items.length === 0) return;
    
    // Limpiar lista actual
    itemListElement.innerHTML = '';
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        
        const subtotal = parseFloat(item.precio) * parseInt(item.cantidad);
        
        itemElement.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.nombre}</span>
                <span class="item-quantity">Cantidad: ${item.cantidad}</span>
            </div>
            <span class="item-price">${formatCurrency(subtotal)}</span>
        `;
        
        itemListElement.appendChild(itemElement);
    });
}

// ✅ FUNCIÓN PARA OCULTAR INFORMACIÓN DE DIRECCIÓN
function hideDeliveryInfo() {
    const deliveryInfoElement = document.querySelector('.delivery-info');
    if (deliveryInfoElement) {
        deliveryInfoElement.style.display = 'none';
    }
}

// Función para actualizar datos dinámicos en la página de éxito
function updateSuccessPageData() {
    const params = getUrlParams();
    console.log('Parámetros recibidos:', params);
    
    // Actualizar número de orden
    const orderNumberElement = document.querySelector('.order-number');
    if (orderNumberElement && params.orderId) {
        orderNumberElement.textContent = `#${params.orderId}`;
    }
    
    // Actualizar lista de productos
    if (params.items) {
        try {
            const items = JSON.parse(params.items);
            updateItemList(items);
        } catch (error) {
            console.error('Error parseando items:', error);
        }
    }
    
    // ✅ SOLO ACTUALIZAR SUBTOTAL
    updateTotals(params);
    
    // Ocultar información de dirección
    hideDeliveryInfo();
}

// Función para actualizar datos en página de error
function updateFailedPageData() {
    const params = getUrlParams();
    
    const orderNumberElement = document.querySelector('.order-number');
    if (orderNumberElement && params.orderId) {
        orderNumberElement.textContent = `#${params.orderId}`;
    }
    
    const errorReasonElement = document.querySelector('.error-reason strong');
    const errorDescriptionElement = document.querySelector('.error-description');
    
    if (params.reason) {
        if (errorReasonElement) {
            errorReasonElement.textContent = params.reason;
        }
        if (errorDescriptionElement) {
            errorDescriptionElement.textContent = `Error: ${params.reason}. Por favor, intenta nuevamente.`;
        }
    }
}

// Detectar qué página estamos viendo
function initializePage() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('payment-succes.html')) {
        updateSuccessPageData();
    } else if (currentPage.includes('payment-failed.html')) {
        updateFailedPageData();
    } else if (currentPage.includes('payment-pending.html')) {
        const params = getUrlParams();
        const orderNumberElement = document.querySelector('.order-number');
        if (orderNumberElement && params.orderId) {
            orderNumberElement.textContent = `#${params.orderId}`;
        }
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando página de pago simplificada...');
    initializePage();
});