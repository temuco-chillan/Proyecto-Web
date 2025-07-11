const apiUrl = window.location.hostname.includes('localhost')
  ? 'http://localhost:3000/api/Productos'
  : '/api/Productos';

// Función para obtener Productos de la API
function fetchProductos() {
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('ProductosList');
      if (!tableBody) return;

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
            <button class="btn" onclick="addToCarrito(${P.id})">agregar al carro</button> 
          </td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(error => console.error('❌ Error al obtener productos:', error));
}

// Crear o actualizar producto
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('ProductosForm');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const id = document.getElementById('productoId').value;
      const nombre = document.getElementById('productoName').value.trim();
      const estado = document.getElementById('productoState').value.trim();
      const precio = parseFloat(document.getElementById('productoPrice').value);
      let categorias = [];

      const categoriasSelect = document.getElementById('productoCategorias');
      if (categoriasSelect) {
        categorias = Array.from(categoriasSelect.selectedOptions).map(opt => Number(opt.value));
      }

      const method = id ? 'PUT' : 'POST';
      const url = id ? `${apiUrl}/${id}` : apiUrl;

      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, estado, precio, categorias })
      })
        .then(async res => {
          if (!res.ok) {
            const err = await res.text();
            throw new Error(err || 'Error desconocido');
          }
          return res.json();
        })
        .then(data => {
          alert(id ? 'Producto actualizado' : 'Producto agregado');
          fetchProductos();
          form.reset();
          document.getElementById('productoId').value = '';
          document.getElementById('submitBtn').innerText = 'Agregar Producto';
        })
        .catch(error => console.error('❌ Error al agregar/actualizar producto:', error));
    });
  }

  fetchProductos();
  fetchCategorias();
});

function editProducto(id, nombre, estado, precio) {
  document.getElementById('productoId').value = id;
  document.getElementById('productoName').value = nombre;
  document.getElementById('productoState').value = estado;
  document.getElementById('productoPrice').value = precio;
  document.getElementById('submitBtn').innerText = 'Actualizar Producto';

  fetch(`/api/Productos/${id}/categorias`)
    .then(async res => {
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error cargando categorías');
      }
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data)) {
        console.error('❌ Categorías no válidas:', data);
        return;
      }

      const select = document.getElementById('productoCategorias');
      if (!select) {
        console.warn('⚠️ No se encontró el elemento select con ID "productoCategorias"');
        return;
      }

      const idsSeleccionados = data.map(c => c.id);
      Array.from(select.options).forEach(opt => {
        opt.selected = idsSeleccionados.includes(Number(opt.value));
      });
    })
    .catch(error => {
      console.error('❌ Error al cargar categorías del producto:', error.message);
    });
}

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

function logout() {
  localStorage.removeItem('loggedUser');
  window.location.href = 'login.html';
}

function getAccount() {
  const stored = localStorage.getItem('loggedUser');
  if (!stored) {
    console.warn('No hay usuario en sesión.');
    return null;
  }
  const user = JSON.parse(stored);
  console.log(user.username);
  console.log(user.rol);
  return user;
}

async function fetchCategorias() {
  try {
    const res = await fetch('/api/categorias');
    const data = await res.json();

    const select = document.getElementById('productoCategorias');
    const input = document.getElementById('nuevaCategoriaInput');
    const button = document.getElementById('crearCategoriaBtn');

    if (!select || !input || !button) {
      console.warn('⚠️ Elementos de categoría no están disponibles en el DOM');
      return;
    }

    select.innerHTML = '';

    if (Array.isArray(data) && data.length > 0) {
      data.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = c.nombre;
        select.appendChild(option);
      });
    }

    const crearOption = document.createElement('option');
    crearOption.value = 'crear';
    crearOption.textContent = '➕ Crear nueva';
    select.appendChild(crearOption);

    input.style.display = 'none';
    button.style.display = 'none';
  } catch (err) {
    console.error('❌ Error al cargar categorías:', err);
  }
}
