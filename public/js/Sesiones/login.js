document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('message');

    // Validaciones del lado del cliente con mensajes específicos
    if (!username && !password) {
        message.style.color = 'red';
        message.textContent = '⚠️ Por favor, ingresa tu nombre de usuario y contraseña';
        return;
    }
    
    if (!username) {
        message.style.color = 'red';
        message.textContent = '👤 El nombre de usuario es obligatorio';
        return;
    }
    
    if (!password) {
        message.style.color = 'red';
        message.textContent = '🔒 La contraseña es obligatoria';
        return;
    }

    if (username.length < 3) {
        message.style.color = 'red';
        message.textContent = '📏 El nombre de usuario debe tener al menos 3 caracteres';
        return;
    }

    if (password.length < 6) {
        message.style.color = 'red';
        message.textContent = '🔐 La contraseña debe tener al menos 6 caracteres';
        return;
    }

    // Mostrar mensaje de carga
    message.style.color = '#2196F3';
    message.textContent = '🔄 Verificando credenciales...';

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Enviar/recibir cookies de sesión
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            message.style.color = 'red';
            message.textContent = data.message || 'Credenciales incorrectas';
            return;
        }

        message.style.color = 'green';
        message.textContent = '✅ Sesión iniciada';
        setTimeout(() => window.location.href = '/', 500);
    } catch (error) {
        console.error(error);
        message.style.color = 'red';
        message.textContent = 'Error al iniciar sesión. Intenta nuevamente.';
    }
});