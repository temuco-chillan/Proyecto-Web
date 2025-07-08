const apiUrl = window.location.hostname.includes('localhost')
    ? 'http://localhost:3000/api/Productos'
    : '/api/Productos';

// Función para obtener Productos de la API
function fetchProductos() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('ProductosList');
            tableBody.innerHTML = ''; // Limpiar tabla
            data.forEach(P => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${P.id}</td>
                    <td>${P.nombre}</td>
                    <td>${P.estado}</td>
                    <td>$${P.precio}</td>
                    <td>
                        <button class="btn" onclick="editProducto(${P.id}, '${P.nombre}', '${P.estado}', '${P.precio}')">Editar</button>
                        <button class="btn" onclick="deleteProducto(${P.id})">Eliminar</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('❌ Error al obtener productos:', error));
}

// Crear o actualizar producto
document.getElementById('ProductosForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const id = document.getElementById('productoId').value;
    const nombre = document.getElementById('productoName').value.trim();
    const estado = document.getElementById('productoState').value.trim();
    const precio = parseFloat(document.getElementById('productoPrice').value);

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${apiUrl}/${id}` : apiUrl;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, estado, precio })
    })
        .then(res => res.json())
        .then(data => {
            alert(id ? 'Producto actualizado' : 'Producto agregado');
            fetchProductos();
            document.getElementById('ProductosForm').reset();
            document.getElementById('productoId').value = '';
            document.getElementById('submitBtn').innerText = 'Agregar Producto';
        })
        .catch(error => console.error('❌ Error al agregar/actualizar producto:', error));
});

// Función para precargar datos en formulario
function editProducto(id, nombre, estado, precio) {
    document.getElementById('productoId').value = id;
    document.getElementById('productoName').value = nombre;
    document.getElementById('productoState').value = estado;
    document.getElementById('productoPrice').value = precio;
    document.getElementById('submitBtn').innerText = 'Actualizar Producto';
}

// Función para eliminar producto
function deleteProducto(id) {
    if (confirm('¿Eliminar este producto?')) {
        fetch(`${apiUrl}/${id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(data => {
                alert('Producto eliminado');
                fetchProductos();
            })
            .catch(error => console.error('❌ Error al eliminar producto:', error));
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('loggedUser');
    window.location.href = 'login.html';
}

// Obtener cuenta activa
function getAccount() {
    const stored = localStorage.getItem('loggedUser');
    if (!stored) {
        console.warn('No hay usuario en sesión.');
        return null;
    }
    const user = JSON.parse(stored);
    console.log(user.username); // Ej: "root"
    console.log(user.rol);      // Ej: "admin"
    return user;
}

// Iniciar
fetchProductos();
