document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('message');

    try {
        const response = await fetch('/api/users/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            message.style.color = 'green';
            message.textContent = result.message || 'Login exitoso';

            // Guardar usuario logueado en localStorage
            localStorage.setItem('loggedUser', JSON.stringify(result.user));

            // Redirigir a página principal
            window.location.href = 'index.html';
        } else {
            message.style.color = 'red';
            message.textContent = result.message || 'Usuario o contraseña incorrectos';
        }
    } catch (error) {
        message.style.color = 'red';
        message.textContent = 'Error al conectar con el servidor';
        console.error('Error:', error);
    }
});
