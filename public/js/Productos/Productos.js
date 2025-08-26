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
      tableBody.innerHTML = '';
      
      // Procesar cada producto de forma asíncrona
      data.forEach(async P => {
        const row = document.createElement('tr');
        let CategoriasNombres = 'Sin categorías';
        try {
          if (P.id) {
            CategoriasNombres = []
            categorias = await getCategories(P.id);
            categorias.forEach(async c => {
               CategoriasNombres.push(c.nombre);
            })
          }
        } catch (error) {
          console.error(`Error al obtener categorías para producto ${P.id}:`, error);
          CategoriasNombres = 'Error al cargar';
        }
        
        row.innerHTML = `
          <td>${P.id}</td>
          <td>${P.nombre}</td>
          <td>${CategoriasNombres}</td>
          <td>${P.estado}</td>
          <td>$${P.precio}</td>
          <td>${P.descuento}%</td>
          <td>${P.stock}</td>
          <td><img src="${P.imagen_url}" alt="Imagen" width="50" height="50"></td>
          <td>
            <button class="btn" onclick="editProducto(${P.id})">Editar</button>
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
      const descuento = parseInt(document.getElementById('productoDescuento').value) || 0;
      const stock = parseInt(document.getElementById('productoStock').value) || 0;
      const imagen_url = document.getElementById('productoImagen').value.trim();
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
        body: JSON.stringify({
          nombre,
          estado,
          precio,
          descuento,
          stock,
          imagen_url,
          categorias
        })
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
          document.getElementById('productoDescuento').value = '';
          document.getElementById('productoStock').value = '';
          document.getElementById('productoImagen').value = '';
          document.getElementById('productoId').value = '';
          document.getElementById('submitBtn').innerText = 'Agregar Producto';
        })
        .catch(error => console.error('❌ Error al agregar/actualizar producto:', error));
    });
  }

  fetchProductos();
  fetchCategorias();
});

function editProducto(id) {
  fetch(`${apiUrl}/${id}`)
    .then(res => {
      if (!res.ok) throw new Error('Error al cargar el producto');
      return res.json();
    })
    .then(producto => {
      // Asignar valores al formulario
      document.getElementById('productoId').value = producto.id;
      document.getElementById('productoName').value = producto.nombre;
      document.getElementById('productoState').value = producto.estado;
      document.getElementById('productoPrice').value = producto.precio;
      document.getElementById('productoDescuento').value = producto.descuento || 0;
      document.getElementById('productoStock').value = producto.stock || 0;
      document.getElementById('productoImagen').value = producto.imagen_url || '';

      document.getElementById('submitBtn').innerText = 'Actualizar Producto';

      // Ahora carga sus categorías
      return fetch(`${apiUrl}/${id}/categorias`);
    })
    .then(res => {
      if (!res.ok) throw new Error('Error al cargar categorías del producto');
      return res.json();
    })
    .then(categorias => {
      const select = document.getElementById('productoCategorias');
      const idsSeleccionados = categorias.map(c => c.id);

      Array.from(select.options).forEach(opt => {
        opt.selected = idsSeleccionados.includes(Number(opt.value));
      });
    })
    .catch(error => {
      console.error('❌ Error al editar producto:', error.message);
    });
}
function getCategories(id_Producto){
    const CategoriaURL = "http://localhost:3000/api/Productos/" + id_Producto + "/categorias";
    
    return fetch(CategoriaURL)
        .then(res => {
            if (!res.ok) {
                throw new Error('Error en la petición: ' + res.status);
            }
            return res.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('Error al obtener categorías:', error);
            throw error;
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
