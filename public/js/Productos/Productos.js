const apiUrl = window.location.hostname.includes('localhost')
    ? 'http://localhost:3000/api/Productos'
    : '/api/Productos';
// Función para obtener computadores de la API
function fetchProductos() {
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('ProductosList');
            tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar los nuevos Productos
            data.forEach(Productos => {
                const row = document.createElement('tr');
                row.innerHTML = `
                            <td>${Productos.id}</td>
                            <td>${Productos.nombre_Producto}</td>
                            <td>${Productos.estado}</td>
                            <td>${Productos.precio}</td>
                            <td>
                                <button class="btn" onclick="editProducto(${Productos.id}, '${Productos.nombre_Producto}', '${Productos.estado}', '${Productos.precio}')">Editar</button>
                                <button class="btn" onclick="deleteProducto(${Productos.id})">Eliminar</button>
                            </td>
                        `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.log('Error al obtener los productos:', error));
}
// Función para agregar un nuevo Producto
document.getElementById('ProductosForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const id = document.getElementById('productoId').value;
    const nombre = document.getElementById('productoName').value;
    const estado = document.getElementById('productoState').value;
    const precio = document.getElementById('productoPrice').value;

    const method = id ? 'PUT' : 'POST'; // Si tiene id, se hace PUT (actualización), si no, POST (insertar)
    const url = id ? `${apiUrl}/${id}` : apiUrl;

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            nombre_Producto: nombre,
            estado: estado,
            precio: precio,
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            alert(id ? 'Producto actualizado' : 'Producto agregado');
            fetchProductos(); // Refrescar la lista de Productos
            document.getElementById('ProductosForm').reset(); // Limpiar el formulario
            document.getElementById('productoId').value = ''; // Limpiar el ID del Producto
        })
        .catch(error => console.log('Error al agregar/actualizar Producto.', error));
});

// Función para editar un producto
function editProducto(id, nombre, estado, precio) {
    document.getElementById('productoId').value = id;
    document.getElementById('productoName').value = nombre;
    document.getElementById('productoState').value = estado;
    document.getElementById('productoPrice').value = precio;
    document.getElementById('submitBtn').innerText = 'Actualizar Producto'; // Cambiar el texto del botón
}
// Función para eliminar un computador
function deleteProducto(id) {
    if (confirm('¿Estás seguro de eliminar este Producto?')) {
        fetch(`${apiUrl}/${id}`, {
            method: 'DELETE',
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                alert('Producto eliminado');
                fetchProductos(); // Refrescar la lista de Productos
            })
            .catch(error => console.log('Error al eliminar Producto:', error));
    }
}
function logout() {
    localStorage.removeItem('loggedUser');
    window.location.href = 'login.html';
}
//obtener datos de la cuenta iniciada
function getAccount() {
    // Obtener el string desde localStorage
    const stored = localStorage.getItem('loggedUser');
    // Si no hay nada, salir o manejar el error
    if (!stored) {
        console.warn('No hay usuario en sesión.');
        return null;
    }
    // Convertir de string JSON a objeto JavaScript
    const user = JSON.parse(stored);
    // De esta manera se llama a las variables.
    console.log(user.username); Ej: "root"
    console.log(user.rol); Ej: "usuario / admin"
    return user;
}
fetchProductos();