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
function fetchCarritoPage() {
    const user = getAccount();
    if (!user) return;

    fetch(`${carritoApiUrl}/${user.id}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('carritoList');
            
            // ✅ VERIFICAR QUE EL ELEMENTO EXISTE
            if (!tableBody) {
                console.error('Elemento carritoList no encontrado');
                return;
            }
            
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

            // ✅ VERIFICAR QUE EL ELEMENTO TOTAL EXISTS
            const totalElement = document.getElementById('totalCarrito');
            if (totalElement) {
                const totalGeneral = data.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
                totalElement.innerText = `Total General: $${totalGeneral.toFixed(2)}`;
            }
        })
        .catch(error => console.error('❌ Error al obtener carrito:', error));
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
        .then(res => res.json())
        .then(data => {
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                alert('❌ Error al generar el link de pago');
            }
        })
        .catch(error => console.error('❌ Error al procesar pago:', error));
}

// === Cargar carrito al iniciar ===
fetchCarritoPage();  // ✅ ACTUALIZADO
