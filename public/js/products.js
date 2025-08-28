// ========================
// PRODUCTS & CART FUNCTIONALITY
// ========================

// Variables globales para productos
let products = [];
let categories = [];
let cartItems = [];
let cartUpdateInterval = null;

// Función para cargar categorías
async function loadCategories() {
    try {
        const response = await fetch("/api/categorias");
        categories = await response.json();
    } catch (error) {
        console.error("Error al cargar categorías:", error);
        throw error;
    }
}

// Función para cargar productos
async function loadProducts() {
    try {
        const response = await fetch("/api/Productos");
        products = await response.json();
        await renderProducts();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        throw error;
    }
}

// Función para renderizar productos
async function renderProducts() {
    const productsGrid = document.getElementById("products-grid");
    if (!productsGrid) {
        console.log(
            "products-grid no encontrado - probablemente en página sin productos"
        );
        return;
    }
    if (products.length === 0) {
        productsGrid.innerHTML =
            '<p class="no-products">No hay productos disponibles</p>';
        return;
    }
    productsGrid.innerHTML = products
        .map((product) => {
            const hasDiscount = product.descuento && product.descuento > 0;
            const originalPrice = parseFloat(product.precio);
            const discountedPrice = hasDiscount
                ? originalPrice * (1 - product.descuento / 100)
                : originalPrice;
            let pricingHTML;
            if (hasDiscount) {
                pricingHTML = `
                <div class="product-pricing">
                    <div class="price-container">
                        <span class="original-price">$${originalPrice.toFixed(
                    2
                )}</span>
                        <span class="discounted-price">$${discountedPrice.toFixed(
                    2
                )}</span>
                        <span class="discount-badge">${product.descuento
                    }% OFF</span>
                    </div>
                </div>
            `;
            } else {
                pricingHTML = `
                <div class="product-pricing">
                    <span class="current-price">$${originalPrice.toFixed(
                    2
                )}</span>
                </div>
            `;
            }
            return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.imagen_url ||
                "https://via.placeholder.com/200x250/4a90e2/ffffff?text=" +
                encodeURIComponent(product.nombre)
                }" 
                         alt="${product.nombre}" 
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/200x250/cccccc/666666?text=Sin+Imagen'">
                </div>
                <h3 class="product-name">${product.nombre}</h3>
                <p class="product-description">${product.descripcion || ""}</p>
                ${pricingHTML}
                <button class="add-button" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i>
                    Agregar al Carrito
                </button>
            </div>
        `;
        })
        .join("");
}

// Función para inicializar el carrusel de productos
function setupCarousel() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    let cards = Array.from(grid.getElementsByClassName("product-card"));
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const visibleCount = 4; // productos visibles a la vez
    let start = 0;
    let autoTimeout = null;
    const autoDelay = 5000;

    // Ajusta el ancho del grid según la cantidad de productos visibles
    grid.style.width = `${visibleCount * 290}px`; // 250px card + 2*20px margin

    function updateCarousel(animate = true) {
        const cardWidth = cards[0].offsetWidth + 40; // 20px margen a cada lado
        let offset = start * cardWidth;
        if (cards.length < visibleCount) offset = 0; // Solo si hay menos de 4
        grid.style.transition = animate ? "transform 0.6s cubic-bezier(.4,0,.2,1)" : "none";
        grid.style.transform = `translateX(-${offset}px)`;
    }

    function next(animate = true) {
        start = (start + 1) % cards.length;
        updateCarousel(animate);
        startAuto();
    }

    function prev(animate = true) {
        start = (start - 1 + cards.length) % cards.length;
        updateCarousel(animate);
        startAuto();
    }

    function startAuto() {
        if (autoTimeout) clearTimeout(autoTimeout);
        autoTimeout = setTimeout(() => {
            next();
        }, autoDelay);
    }

    if (prevBtn) prevBtn.onclick = () => prev();
    if (nextBtn) nextBtn.onclick = () => next();

    updateCarousel(false);
    startAuto();
}

// Función para agregar al carrito
async function addToCart(productId) {
    console.log("=== INICIANDO addToCart ===" + productId);
    const currentUser =
        window.currentUser ||
        JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        if (window.showNotification) {
            window.showNotification(
                "Debes iniciar sesión para agregar productos al carrito",
                "error"
            );
        }
        return;
    }
    try {
        console.log("Enviando petición POST...");
        const response = await fetch("/api/carrito", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                producto_id: productId,
                cantidad: 1,
            }),
        });
        console.log("Respuesta recibida:", response.status);
        if (response.ok) {
            console.log("Producto agregado, actualizando vista...");
            setTimeout(async () => {
                await forceUpdateCart();
            }, 100);
            if (window.showNotification) {
                window.showNotification("Producto agregado al carrito", "success");
            }
        } else {
            const error = await response.json();
            if (window.showNotification) {
                window.showNotification(
                    error.error || "Error al agregar producto",
                    "error"
                );
            }
        }
    } catch (error) {
        console.error("Error al agregar al carrito:", error);
        if (window.showNotification) {
            window.showNotification("Error de conexión", "error");
        }
    }
}

// Función para actualizar cantidad en carrito
async function updateCartQuantity(productId, newQuantity) {
    const currentUser =
        window.currentUser ||
        JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        if (window.showNotification) {
            window.showNotification(
                "Debes iniciar sesión para modificar el carrito",
                "error"
            );
        }
        return;
    }
    if (newQuantity <= 0) {
        await removeFromCart(productId);
        return;
    }
    try {
        const response = await fetch("/api/carrito", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                producto_id: productId,
                cantidad: newQuantity,
            }),
        });
        if (response.ok) {
            await forceUpdateCart();
        } else {
            if (window.showNotification) {
                window.showNotification("Error al actualizar cantidad", "error");
            }
        }
    } catch (error) {
        console.error("Error al actualizar cantidad:", error);
        if (window.showNotification) {
            window.showNotification("Error de conexión", "error");
        }
    }
}

// Función para remover del carrito
async function removeFromCart(productId) {
    const currentUser =
        window.currentUser ||
        JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        if (window.showNotification) {
            window.showNotification(
                "Debes iniciar sesión para modificar el carrito",
                "error"
            );
        }
        return;
    }
    try {
        const response = await fetch("/api/carrito", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                usuario_id: currentUser.id,
                producto_id: productId,
            }),
        });
        if (response.ok) {
            await forceUpdateCart();
            if (window.showNotification) {
                window.showNotification("Producto eliminado del carrito", "success");
            }
        } else {
            if (window.showNotification) {
                window.showNotification("Error al eliminar producto", "error");
            }
        }
    } catch (error) {
        console.error("Error al eliminar del carrito:", error);
        if (window.showNotification) {
            window.showNotification("Error de conexión", "error");
        }
    }
}

// Función para actualizar display del carrito
async function updateCartDisplay(silent = false) {
    console.log("Actualizando carrito display...");
    const currentUser =
        window.currentUser ||
        JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        console.log("No hay usuario logueado");
        cartItems = [];
        if (document.getElementById("cart-count")) {
            updateCartUI();
        }
        return;
    }
    try {
        console.log("Obteniendo carrito del usuario:", currentUser.id);
        const response = await fetch(`/api/carrito/${currentUser.id}`);
        const newCartItems = await response.json();
        console.log("Nuevos items del carrito:", newCartItems);
        cartItems = newCartItems;
        updateCartUI();
        if (!silent) {
            console.log("Carrito actualizado exitosamente");
        }
    } catch (error) {
        console.error("Error al actualizar carrito:", error);
        cartItems = [];
        if (document.getElementById("cart-count")) {
            updateCartUI();
        }
    }
}

// Función para actualizar UI del carrito
function updateCartUI() {
    console.log("Actualizando UI con items:", cartItems);
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
        const totalItems = cartItems.reduce(
            (total, item) => total + parseInt(item.cantidad),
            0
        );
        if (totalItems > 0) {
            cartCount.textContent = totalItems;
            cartCount.style.display = "block";
        } else {
            cartCount.style.display = "none";
        }
    }
    updateCartSidebar(cartItems);
}

// Función para actualizar sidebar del carrito
function updateCartSidebar(items) {
    console.log("=== ACTUALIZANDO SIDEBAR ===");
    console.log("Items para sidebar:", items);
    const cartContent = document.getElementById("cart-content");
    const cartFooter = document.getElementById("cart-footer");
    const emptyCart = document.getElementById("empty-cart");
    const cartTotal = document.getElementById("cart-total");
    if (!cartContent) {
        console.log("cart-content no encontrado - página sin carrito");
        return;
    }
    if (items.length === 0) {
        console.log("Carrito vacío, mostrando mensaje");
        if (emptyCart) emptyCart.style.display = "block";
        if (cartFooter) cartFooter.style.display = "none";
        cartContent.innerHTML = "";
    } else {
        console.log("Carrito con items, renderizando...");
        if (emptyCart) emptyCart.style.display = "none";
        if (cartFooter) cartFooter.style.display = "block";
        const total = items.reduce((sum, item) => {
            const finalPrice = item.precio_con_descuento || item.precio;
            return sum + parseFloat(finalPrice) * parseInt(item.cantidad);
        }, 0);
        if (cartTotal) cartTotal.textContent = total.toFixed(2);
        cartContent.innerHTML = "";
        items.forEach((item) => {
            console.log("Renderizando item:", item.nombre);
            const cartItemDiv = document.createElement("div");
            cartItemDiv.className = "cart-item";
            cartItemDiv.setAttribute("data-product-id", item.producto_id);
            const product = products.find((p) => p.id === item.producto_id);
            const imageUrl =
                product?.imagen_url ||
                `https://via.placeholder.com/60x60/cccccc/666666?text=${encodeURIComponent(
                    item.nombre.substring(0, 3)
                )}`;
            const hasDiscount = item.descuento_aplicado > 0;
            const discountPercent = item.descuento_aplicado || 0;
            const originalPrice = item.precio_original || item.precio;
            const finalPrice = item.precio_con_descuento || item.precio;
            let priceHTML;
            if (hasDiscount) {
                priceHTML = `
                    <div class="price-container">
                        <span class="original-price">$${parseFloat(
                    originalPrice
                ).toFixed(2)}</span>
                        <span class="discounted-price">$${parseFloat(
                    finalPrice
                ).toFixed(2)}</span>
                        <span class="discount-badge">${discountPercent.toFixed(
                    1
                )}% OFF</span>
                    </div>
                `;
            } else {
                priceHTML = `<p class="cart-item-price">$${parseFloat(
                    finalPrice
                ).toFixed(2)}</p>`;
            }
            cartItemDiv.innerHTML = `
                <div class="cart-item-image">
                    <img src="${imageUrl}" 
                         alt="${item.nombre}" 
                         onerror="this.src='https://via.placeholder.com/60x60/cccccc/666666?text=Sin+Imagen'">
                </div>
                <div class="cart-item-info">
                    <h4>${item.nombre}</h4>
                    ${priceHTML}
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.producto_id
                }, ${item.cantidad - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity">${item.cantidad}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.producto_id
                }, ${item.cantidad + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="remove-btn" onclick="removeFromCart(${item.producto_id
                })">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cartContent.appendChild(cartItemDiv);
        });
        console.log("Items renderizados en el sidebar");
    }
}

// Función para refrescar carrito desde API
async function refreshCartFromAPI() {
    console.log("=== REFRESCANDO CARRITO DESDE API ===");
    const currentUser =
        window.currentUser ||
        JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        console.log("No hay usuario logueado");
        cartItems = [];
        updateCartUI();
        return;
    }
    try {
        console.log("Consultando API del carrito para usuario:", currentUser.id);
        const response = await fetch(`/api/carrito/${currentUser.id}`);
        const items = await response.json();
        console.log("Items recibidos:", items);
        cartItems = items;
        updateCartUI();
        console.log("✅ Carrito refrescado exitosamente");
    } catch (error) {
        console.error("❌ Error al refrescar carrito:", error);
        cartItems = [];
        updateCartUI();
    }
}

// Función para forzar actualización del carrito
async function forceUpdateCart() {
    console.log("=== FORZANDO ACTUALIZACIÓN DEL CARRITO ===");
    const currentUser =
        window.currentUser ||
        JSON.parse(localStorage.getItem("currentUser") || "null");
    if (!currentUser) {
        console.log("No hay usuario logueado");
        return;
    }
    try {
        console.log("Consultando API del carrito...");
        const response = await fetch(`/api/carrito/${currentUser.id}`);
        const items = await response.json();
        console.log("Items recibidos de la API:", items);
        cartItems = items;
        const cartCount = document.getElementById("cart-count");
        if (cartCount) {
            const totalItems = items.reduce(
                (total, item) => total + parseInt(item.cantidad),
                0
            );
            console.log("Total de items calculado:", totalItems);
            if (totalItems > 0) {
                cartCount.textContent = totalItems;
                cartCount.style.display = "block";
                console.log("Contador actualizado a:", totalItems);
            } else {
                cartCount.style.display = "none";
                console.log("Carrito vacío, ocultando contador");
            }
        }
        updateCartSidebar(items);
    } catch (error) {
        console.error("Error al forzar actualización:", error);
    }
}

// Función para iniciar actualización automática del carrito
function startCartAutoUpdate() {
    if (cartUpdateInterval) {
        clearInterval(cartUpdateInterval);
    }
    cartUpdateInterval = setInterval(async () => {
        const currentUser =
            window.currentUser ||
            JSON.parse(localStorage.getItem("currentUser") || "null");
        if (currentUser) {
            await updateCartDisplay(true);
        }
    }, 30000);
}

// Función para detener actualización automática
function stopCartAutoUpdate() {
    if (cartUpdateInterval) {
        clearInterval(cartUpdateInterval);
        cartUpdateInterval = null;
    }
}

// Función de inicialización principal
async function initializeProducts() {
    try {
        await loadCategories();
        await loadProducts();
        setupCarousel(); // Ahora se llama después de que los productos se renderizan
        const currentUser =
            window.currentUser ||
            JSON.parse(localStorage.getItem("currentUser") || "null");
        if (currentUser) {
            await refreshCartFromAPI();
            startCartAutoUpdate();
        }
        console.log("✅ Productos inicializados correctamente");
    } catch (error) {
        console.error("❌ Error al inicializar productos:", error);
    }
}

// El único y correcto punto de entrada para todo el script
document.addEventListener("DOMContentLoaded", initializeProducts);

// Exponer funciones globalmente
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.refreshCartFromAPI = refreshCartFromAPI;
window.updateCartUI = updateCartUI;
window.updateCartDisplay = updateCartDisplay;
window.forceUpdateCart = forceUpdateCart;
window.startCartAutoUpdate = startCartAutoUpdate;
window.stopCartAutoUpdate = stopCartAutoUpdate;
window.loadProducts = loadProducts;
window.renderProducts = renderProducts;

// Exponer variables globales
window.products = products;
window.cartItems = cartItems;
window.categories = categories;
