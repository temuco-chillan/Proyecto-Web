document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim(); // <- Agregado
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('message');

    const rol_id = 2; // Usuario común

    // Validación simple (opcional pero útil)
    if (!username || !email || !password) {
        message.style.color = 'red';
        message.textContent = 'Todos los campos son obligatorios';
        return;
    }

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, rol_id }) // <- Agregado email
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
