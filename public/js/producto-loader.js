// Script para cargar datos dinámicos del producto en la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si tenemos datos del producto inyectados
    if (typeof window.productData !== 'undefined' && window.productData) {
        loadProductData(window.productData);
    } else {
        // Si no hay datos inyectados, intentar obtener el ID de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id') || window.productId;
        
        if (productId) {
            fetchProductData(productId);
        } else {
            showError('No se pudo identificar el producto.');
        }
    }
});

// Función para cargar datos del producto en el HTML
function loadProductData(producto) {
    try {
        // Actualizar título del producto
        const titleElement = document.querySelector('.summary__title h1');
        if (titleElement && producto.nombre) {
            titleElement.textContent = producto.nombre;
        }
        
        // Actualizar precio
        const priceElement = document.querySelector('.summary__title .price');
        if (priceElement && producto.precio) {
            priceElement.textContent = `$${formatPrice(producto.precio)}`;
        }
        
        // Actualizar descripción
        const descriptionElement = document.querySelector('.details-text .block p');
        if (descriptionElement && producto.descripcion) {
            descriptionElement.textContent = producto.descripcion;
        }
        
        // Actualizar características si existen
        if (producto.caracteristicas && Array.isArray(producto.caracteristicas)) {
            const featuresElement = document.querySelector('.features');
            if (featuresElement) {
                featuresElement.innerHTML = '';
                producto.caracteristicas.forEach(caracteristica => {
                    const li = document.createElement('li');
                    li.textContent = caracteristica;
                    featuresElement.appendChild(li);
                });
            }
        }
        
        // Cargar imágenes del carrusel desde la nueva API
        if (producto.id) {
            fetchCarruselImages(producto.id);
        }
        
        // Actualizar video si existe video_url
        if (producto.video_url) {
            updateProductVideo(producto.video_url);
        }
        
        // Actualizar stock
        const stockElement = document.querySelector('.stock');
        if (stockElement && typeof producto.stock !== 'undefined') {
            const stockDot = stockElement.querySelector('.dot');
            if (producto.stock > 0) {
                stockElement.innerHTML = `<span class="dot" style="background-color: #4CAF50;"></span> En Stock (${producto.stock})`;
            } else {
                stockElement.innerHTML = `<span class="dot" style="background-color: #f44336;"></span> Sin Stock`;
                // Deshabilitar botón de agregar al carrito
                const addButton = document.querySelector('.add-carrito');
                if (addButton) {
                    addButton.disabled = true;
                    addButton.textContent = 'Sin Stock';
                    addButton.style.backgroundColor = '#ccc';
                }
            }
        }
        
        // Actualizar título de la página
        if (producto.nombre) {
            document.title = `${producto.nombre} - Tienda Online`;
        }
        
        // Actualizar meta tags para SEO
        updateMetaTags(producto);
        
        // Configurar funcionalidad del carrito
        setupCartFunctionality(producto);
        
        console.log('Datos del producto cargados exitosamente:', producto);
        
    } catch (error) {
        console.error('Error al cargar datos del producto:', error);
        showError('Error al cargar los datos del producto.');
    }
}

// Nueva función para obtener imágenes del carrusel
async function fetchCarruselImages(productId) {
    try {
        const response = await fetch(`/api/Productos/${productId}/carrusel`);
        
        if (response.ok) {
            const carruselData = await response.json();
            if (carruselData.img_carrusel) {
                updateProductImages(carruselData.img_carrusel);
            }
        } else {
            console.warn('No se encontraron imágenes de carrusel para el producto');
        }
    } catch (error) {
        console.error('Error al obtener imágenes del carrusel:', error);
    }
}

// Nueva función para actualizar el video del producto
function updateProductVideo(videoUrl) {
    const videoIframe = document.querySelector('.video-frame iframe');
    if (videoIframe && videoUrl) {
        videoIframe.src = videoUrl;
        videoIframe.title = 'Video del producto';
    }
}

// Función para actualizar las imágenes del producto
function updateProductImages(imagenes) {
    const mainImage = document.querySelector('.gallery__main img');
    const thumbsContainer = document.querySelector('.gallery__thumbs');
    
    if (mainImage && imagenes.length > 0) {
        // Actualizar imagen principal
        mainImage.src = imagenes[0];
        mainImage.alt = 'Imagen principal del producto';
        
        // Actualizar thumbnails
        if (thumbsContainer) {
            thumbsContainer.innerHTML = '';
            imagenes.forEach((imagen, index) => {
                const thumbButton = document.createElement('button');
                thumbButton.className = 'thumb';
                thumbButton.innerHTML = `<img src="${imagen}" alt="Vista ${index + 1}"/>`;
                
                // Agregar funcionalidad de click
                thumbButton.addEventListener('click', () => {
                    mainImage.src = imagen;
                });
                
                thumbsContainer.appendChild(thumbButton);
            });
        }
    }
}

// Función para obtener datos del producto via API
async function fetchProductData(productId) {
    try {
        const response = await fetch(`/api/Productos/${productId}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const producto = await response.json();
        loadProductData(producto);
        
    } catch (error) {
        console.error('Error al obtener datos del producto:', error);
        showError('No se pudo cargar el producto. Por favor, intenta nuevamente.');
    }
}

// Función para formatear precio
function formatPrice(precio) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(precio).replace('CLP', '').trim();
}

// Función para actualizar meta tags
function updateMetaTags(producto) {
    // Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = producto.descripcion || `${producto.nombre} - Tienda Online`;
    
    // Open Graph tags
    updateOrCreateMetaTag('property', 'og:title', producto.nombre);
    updateOrCreateMetaTag('property', 'og:description', producto.descripcion);
    if (producto.imagen || (producto.imagenes && producto.imagenes[0])) {
        updateOrCreateMetaTag('property', 'og:image', producto.imagen || producto.imagenes[0]);
    }
}

// Función auxiliar para actualizar o crear meta tags
function updateOrCreateMetaTag(attribute, value, content) {
    let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
    if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.setAttribute(attribute, value);
        document.head.appendChild(metaTag);
    }
    metaTag.content = content;
}

// Función para configurar funcionalidad del carrito
function setupCartFunctionality(producto) {
    const addButton = document.querySelector('.add-carrito');
    const quantityElement = document.querySelector('.valor-cantidad');
    const decreaseBtn = document.querySelector('.cantidad-btn[aria-label="Disminuir"]');
    const increaseBtn = document.querySelector('.cantidad-btn[aria-label="Aumentar"]');
    
    let quantity = 1;
    
    // Funcionalidad de cantidad
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (quantity > 1) {
                quantity--;
                quantityElement.textContent = quantity;
            }
        });
    }
    
    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            if (quantity < producto.stock) {
                quantity++;
                quantityElement.textContent = quantity;
            }
        });
    }
    
    // Funcionalidad de agregar al carrito
    if (addButton) {
        addButton.addEventListener('click', async () => {
            if (producto.stock <= 0) {
                alert('Producto sin stock');
                return;
            }
            
            try {
                const response = await fetch('/api/carrito', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        producto_id: producto.id,
                        cantidad: quantity
                    })
                });
                
                if (response.ok) {
                    // Mostrar mensaje de éxito
                    showSuccessMessage(`${producto.nombre} agregado al carrito`);
                    
                    // Actualizar contador del carrito si existe
                    updateCartCounter();
                } else {
                    const error = await response.json();
                    alert(error.message || 'Error al agregar al carrito');
                }
                
            } catch (error) {
                console.error('Error al agregar al carrito:', error);
                alert('Error al agregar al carrito. Por favor, intenta nuevamente.');
            }
        });
    }
}

// Función para mostrar mensaje de éxito
function showSuccessMessage(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Función para actualizar contador del carrito
async function updateCartCounter() {
    try {
        const response = await fetch('/api/carrito');
        if (response.ok) {
            const carrito = await response.json();
            const cartCount = document.getElementById('cart-count');
            if (cartCount && carrito.items) {
                const totalItems = carrito.items.reduce((sum, item) => sum + item.cantidad, 0);
                cartCount.textContent = totalItems;
                cartCount.style.display = totalItems > 0 ? 'block' : 'none';
            }
        }
    } catch (error) {
        console.error('Error al actualizar contador del carrito:', error);
    }
}

// Función para mostrar errores
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="
            background-color: #f44336;
            color: white;
            padding: 20px;
            margin: 20px;
            border-radius: 5px;
            text-align: center;
        ">
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="window.history.back()" style="
                background-color: white;
                color: #f44336;
                border: none;
                padding: 10px 20px;
                border-radius: 3px;
                cursor: pointer;
                margin-top: 10px;
            ">Volver</button>
        </div>
    `;
    
    const main = document.querySelector('main');
    if (main) {
        main.innerHTML = '';
        main.appendChild(errorDiv);
    }
}

// Agregar estilos CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .success-notification {
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
    }
`;
document.head.appendChild(style);

// Función para agregar producto al carrito desde la página de producto
function addToCartFromProduct() {
    // Obtener la cantidad seleccionada
    const cantidad = parseInt(document.querySelector('.valor-cantidad').textContent) || 1;
    
    // Obtener el ID del producto desde la URL o datos cargados
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        // Usar la función addToCart existente si está disponible
        if (typeof addToCart === 'function') {
            for (let i = 0; i < cantidad; i++) {
                addToCart(parseInt(productId));
            }
        } else {
            console.error('Función addToCart no encontrada');
        }
    } else {
        console.error('ID del producto no encontrado');
    }
}

// Funcionalidad para los botones de cantidad
document.addEventListener('DOMContentLoaded', function() {
    const decreaseBtn = document.querySelector('.cantidad-btn[aria-label="Disminuir"]');
    const increaseBtn = document.querySelector('.cantidad-btn[aria-label="Aumentar"]');
    const quantitySpan = document.querySelector('.valor-cantidad');
    
    if (decreaseBtn && increaseBtn && quantitySpan) {
        decreaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantitySpan.textContent) || 1;
            if (currentValue > 1) {
                quantitySpan.textContent = currentValue - 1;
            }
        });
        
        increaseBtn.addEventListener('click', function() {
            let currentValue = parseInt(quantitySpan.textContent) || 1;
            quantitySpan.textContent = currentValue + 1;
        });
    }
});