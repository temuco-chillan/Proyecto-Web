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
function resetForm(){   
    form.reset();
    document.getElementById('index').value = '';
}

//formulario de create en el servidor
form.addEventListener('submit', async e => {
    //evitamos que envie un formulario antes de tiempo
    e.preventDefault();
    //recuperamos los id y las hacemos constantes
    const nombre = document.getElementById('nombre').value;
    const cantidad = document.getElementById('cantidad').value;
    const proveedor = document.getElementById('proveedor').value;
    const index = document.getElementById('index').value;

    //creamos al objeto producto
    const producto = {nombre,cantidad,proveedor};

    //validamos si index esta vacio, segun el caso haremos un Post o un Put
    if(index === ''){
        await fetch('/api/products',{
            method: 'POST',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify(producto)
        });
    } else {
        await fetch(`/api/products/${index}`, {
            method:'PUT',
            headers:{'Content-Type': 'application/json'},
            body : JSON.stringify(producto)
        });
    }
    //reiniciamos el formulatio y mostramos los datos
    resetForm();
    cargarDatos();
});

// composicion del update en el servidor
function editar(index,nombre,cantidad,proveedor){
    document.getElementById('index').value = index;
    document.getElementById('nombre').value = nombre;
    document.getElementById('cantidad').value = cantidad;
    document.getElementById('proveedor').value = proveedor;
}

// composicion del delete en el servidor
async function eliminar(index) {
    //segun la respuesta del ussuario dara lugar a un delete
    if(confirm('¿eliminaras este producto estas seguro?')) {
        await fetch(`/api/products/${index}`,{method:`DELETE`});
        cargarDatos();
    }
}

cargarDatos();