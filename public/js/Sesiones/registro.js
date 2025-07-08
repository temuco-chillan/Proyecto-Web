document.getElementById('registerForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const message = document.getElementById('message');

    // rol_id se puede definir fijo aquí (usuario común = 2)
    const rol_id = 2;

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, rol_id })
        });

        const result = await response.json();

        if (response.ok) {
            message.style.color = 'green';
            message.textContent = result.message || 'Usuario registrado';
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
