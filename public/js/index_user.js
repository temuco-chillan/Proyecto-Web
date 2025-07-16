// Función para cargar categorías y productos
async function loadProductsAndCategories() {
    try {
        showLoading(true);
        
        // Cargar categorías
        const categoriesResponse = await fetch('/api/categorias');
        const categories = await categoriesResponse.json();
        
        // Cargar productos
        const productsResponse = await fetch('/api/Productos');
        const products = await productsResponse.json();
        
        // Organizar productos por categoría
        const productsByCategory = {};
        
        // Inicializar arrays vacíos para cada categoría
        categories.forEach(category => {
            productsByCategory[category.id] = [];
        });
        
        // Obtener categorías para cada producto
        for (const product of products) {
            const categoryResponse = await fetch(`/api/Productos/${product.id}/categorias`);
            const productCategories = await categoryResponse.json();
            
            // Agregar el producto a cada una de sus categorías
            productCategories.forEach(category => {
                if (productsByCategory[category.id]) {
                    productsByCategory[category.id].push(product);
                }
            });
        }
        
        // Renderizar productos por categoría
        renderProductsByCategory(categories, productsByCategory);
        showLoading(false);
        
    } catch (error) {
        console.error('Error:', error);
        showError(true);
        showLoading(false);
    }
}

// Función para renderizar productos por categoría
function renderProductsByCategory(categories, productsByCategory) {
    const container = document.getElementById('categories-container');
    container.innerHTML = categories.map(category => `
        <div class="category-section" id="category-${category.id}">
            <h2 class="category-title">${category.nombre}</h2>
            <div class="carousel-controls">
                <button class="carousel-button prev-button" onclick="scrollCarousel(${category.id}, 'left')" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="carousel-button next-button" onclick="scrollCarousel(${category.id}, 'right')" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="products-grid" id="products-grid-${category.id}">
                ${productsByCategory[category.id].map(product => `
                    <div class="product-card" data-product-id="${product.id}">
                        <div class="product-image">
                            <img src="${product.imagen_url || 'https://via.placeholder.com/150x200/4a90e2/ffffff?text=' + product.nombre}" 
                                 alt="${product.nombre}" 
                                 loading="lazy">
                        </div>
                        <h3 class="product-name">${product.nombre}</h3>
                        <div class="product-pricing">
                            <span class="current-price">$${product.precio}</span>
                            ${product.precio_original ? `<span class="original-price">$${product.precio_original}</span>` : ''}
                        </div>
                        <button class="add-button" onclick="addToCart(${product.id})">Agregar</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Función para controlar el scroll del carrusel
function scrollCarousel(categoryId, direction) {
    const container = document.getElementById(`products-grid-${categoryId}`);
    const scrollAmount = 400; // Ajusta este valor según el ancho de tus tarjetas + margen
    
    if (direction === 'left') {
        container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    } else {
        container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }
}

// Función para agregar al carrito
async function addToCart(productId) {
    try {
        // Aquí deberías obtener el usuario_id de la sesión actual
        const usuario_id = 1; // Ejemplo, debes implementar la gestión de sesión
        
        const response = await fetch('/api/carrito', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario_id: usuario_id,
                producto_id: productId,
                cantidad: 1
            })
        });

        if (response.ok) {
            updateCartCount();
            alert('Producto agregado al carrito');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar el producto al carrito');
    }
}

// Función para actualizar el contador del carrito
async function updateCartCount() {
    try {
        const usuario_id = 1; // Ejemplo, debes implementar la gestión de sesión
        const response = await fetch(`/api/carrito/${usuario_id}`);
        const cartItems = await response.json();
        
        const cartCount = document.getElementById('cart-count');
        const totalItems = cartItems.reduce((total, item) => total + item.cantidad, 0);
        
        if (totalItems > 0) {
            cartCount.textContent = totalItems;
            cartCount.style.display = 'block';
        } else {
            cartCount.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Funciones de utilidad
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

function showError(show) {
    document.getElementById('error-message').style.display = show ? 'block' : 'none';
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    loadProductsAndCategories();
    updateCartCount();
});