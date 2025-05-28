document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('message');

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            message.style.color = 'green';
            message.textContent = result.message;
            // Esperar 2 segundos y redirigir a login
            setTimeout(() => window.location.href = '/login.html', 2000);
        } else {
            message.style.color = 'red';
            message.textContent = result.message;
        }
    } catch (error) {
        message.style.color = 'red';
        message.textContent = 'Error al conectar con el servidor';
        console.error('Error:', error);
    }
});