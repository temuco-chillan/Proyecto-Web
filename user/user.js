const form = document.getElementById('formulario');
const tabla =document.querySelector('#tabla tbody');

//funcion para cargar los datos de productos
async function cargarDatos(){
    //guardamos el resultado despues de hacerle un get
    const res = await fetch('/api/products');
    //convertimos data el larespuesta convertida en json
    const data = await res.json();
    tabla.innerHTML = '';

    //recorremos un foreach de lo cargado en el formato json
    data.forEach((producto,i) => {
        tabla.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${producto.proveedor}</td>
                <td>
                <button onclick="editar('${i}', '${producto.nombre}','${producto.cantidad}','${producto.proveedor}')">Editar</button>
                <button onclick="eliminar(${i})">Eliminar</button>
                </td>
            </tr>
        `;
    });
}
cargarDatos();