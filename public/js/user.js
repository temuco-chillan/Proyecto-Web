//obtenemos la url de la api
const apiUrl = window.location.hostname.includes("localhost")
    ? "http://localhost:3000/api/computadores"
    : "/api/computadores";

// Función para obtener computadores de la API
function fetchComputadores() {
    fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
            const tableBody = document.getElementById("tabla");
            tableBody.innerHTML = ""; // Limpiar la tabla antes de agregar los nuevos computadores
            data.forEach((computador) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                            <td>${computador.id}</td>
                            <td>${computador.nombre_maquina}</td>
                            <td>${computador.estado}</td>
                            <td>
                                <button class="btn" onclick="editComputador(${computador.id}, '${computador.nombre_maquina}', '${computador.estado}')">Editar</button>
                                <button class="btn" onclick="deleteComputador(${computador.id})">Eliminar</button>
                            </td>
                        `;
                tableBody.appendChild(row);
            });
        })
        .catch((error) => console.log("Error al obtener computadores:", error));
}
