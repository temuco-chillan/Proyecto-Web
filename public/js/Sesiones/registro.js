document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const rut = document.getElementById('rut').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const ciudad = document.getElementById('ciudad').value.trim();
    const region = document.getElementById('region').value.trim();
    const codigo_postal = document.getElementById('codigo_postal').value.trim();
    const message = document.getElementById('message');

    const rol_id = 2; // Usuario común

    // Validación de campos obligatorios
    if (!username || !email || !password || !rut || !telefono || !direccion || !ciudad || !region) {
        message.style.color = 'red';
        message.textContent = 'Todos los campos marcados son obligatorios';
        return;
    }

    // Validación básica de RUT (formato chileno)
    const rutPattern = /^[0-9]+-[0-9kK]{1}$/;
    if (!rutPattern.test(rut)) {
        message.style.color = 'red';
        message.textContent = 'El RUT debe tener el formato: 12345678-9';
        return;
    }

    // Validación básica de teléfono
    const telefonoPattern = /^[0-9]{8,15}$/;
    if (!telefonoPattern.test(telefono)) {
        message.style.color = 'red';
        message.textContent = 'El teléfono debe contener solo números (8-15 dígitos)';
        return;
    }

    try {
        const userData = {
            username,
            email,
            password,
            rut,
            telefono,
            direccion,
            ciudad,
            region,
            rol_id
        };

        // Agregar código postal solo si no está vacío
        if (codigo_postal) {
            userData.codigo_postal = codigo_postal;
        }

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            message.style.color = 'green';
            message.textContent = result.message || 'Usuario registrado correctamente';
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            message.style.color = 'red';
            message.textContent = result.message || 'Error al registrar usuario';
        }
    } catch (error) {
        message.style.color = 'red';
        message.textContent = 'Error al conectar con el servidor';
        console.error('Error:', error);
    }
});
