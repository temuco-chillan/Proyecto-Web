        const apiUrl = window.location.hostname.includes('localhost')
        ? 'http://localhost:3000/api/computadores'
        : '/api/computadores';
        // Función para obtener computadores de la API
        function fetchComputadores() {
            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    const tableBody = document.getElementById('computersList');
                    tableBody.innerHTML = ''; // Limpiar la tabla antes de agregar los nuevos computadores
                    data.forEach(computador => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${computador.id}</td>
                            <td>${computador.nombre_maquina}</td>
                            <td>${computador.estado}</td>
                            <td>${computador.precio}</td>
                            <td>
                                <button class="btn" onclick="editComputador(${computador.id}, '${computador.nombre_maquina}', '${computador.estado}', '${computador.precio}')">Editar</button>
                                <button class="btn" onclick="deleteComputador(${computador.id})">Eliminar</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                })
                .catch(error => console.log('Error al obtener computadores:', error));
        }
        // Función para agregar un nuevo computador
        document.getElementById('computerForm').addEventListener('submit', function(event) {
            event.preventDefault();

            const id = document.getElementById('computerId').value;
            const nombre = document.getElementById('computerName').value;
            const estado = document.getElementById('computerState').value;
            const precio = document.getElementById('computerPrice').value;

            const method = id ? 'PUT' : 'POST'; // Si tiene id, se hace PUT (actualización), si no, POST (insertar)
            const url = id ? `${apiUrl}/${id}` : apiUrl;

            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre_maquina: nombre,
                    estado: estado,
                    precio: precio,
                }),
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    alert(id ? 'Computador actualizado' : 'Computador agregado');
                    fetchComputadores(); // Refrescar la lista de computadores
                    document.getElementById('computerForm').reset(); // Limpiar el formulario
                    document.getElementById('computerId').value = ''; // Limpiar el ID del computador
                })
                .catch(error => console.log('Error al agregar/actualizar computador:', error));
        });

        // Función para editar un computador
        function editComputador(id, nombre, estado, precio) {
            document.getElementById('computerId').value = id;
            document.getElementById('computerName').value = nombre;
            document.getElementById('computerState').value = estado;
            document.getElementById('computerPrice').value = precio;
            document.getElementById('submitBtn').innerText = 'Actualizar Computador'; // Cambiar el texto del botón
        }
        // Función para eliminar un computador
        function deleteComputador(id) {
            if (confirm('¿Estás seguro de eliminar este computador?')) {
                fetch(`${apiUrl}/${id}`, {
                    method: 'DELETE',
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        alert('Computador eliminado');
                        fetchComputadores(); // Refrescar la lista de computadores
                    })
                    .catch(error => console.log('Error al eliminar computador:', error));
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
            console.log(user.username);  Ej: "root"
            console.log(user.rol);       Ej: "usuario / admin"
            return user;
        }
        // Obtener computadores cuando cargue la página
        window.onload = function() {
            fetchComputadores();
        };