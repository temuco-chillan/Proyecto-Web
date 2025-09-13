// Función helper para verificar si un usuario es administrador
function checkIfUserIsAdmin(user) {
    if (!user) return false;
    
    // Verificar diferentes formas de identificar un administrador
    const role = user.rol || user.role;
    const roleId = user.rol_id || user.role_id;
    
    // Verificar por rol string
    if (role && (role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrador')) {
        return true;
    }
    
    // Verificar por rol_id numérico (1 = admin)
    if (roleId === 1) {
        return true;
    }
    
    return false;
}

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
        
        // Verificar si el usuario es administrador
        const isAdmin = checkIfUserIsAdmin(data.user);
        if (isAdmin) {
            setTimeout(() => window.location.href = '/panel_admin.html', 500);
        } else {
            setTimeout(() => window.location.href = '/', 500);
        }
    } catch (error) {
        console.error(error);
        message.style.color = 'red';
        message.textContent = 'Error al iniciar sesión. Intenta nuevamente.';
    }
});