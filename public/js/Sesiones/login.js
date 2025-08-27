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
        const response = await fetch('/api/users/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            message.style.color = 'green';
            const welcomeMessages = [
                '🎉 ¡Bienvenido de vuelta!',
                '✅ Inicio de sesión exitoso',
                '🚀 ¡Perfecto! Accediendo a tu cuenta...',
                '👋 ¡Hola! Redirigiendo...'
            ];
            message.textContent = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

            // Cambiar 'loggedUser' por 'currentUser'
            localStorage.setItem('currentUser', JSON.stringify(result.user));

            // Redirigir según el rol del usuario
            setTimeout(() => {
                if (result.user.rol_id === 1) {
                    // Si el usuario es administrador, redirigimos a 'admin.html'
                    window.location.href = 'panel_admin.html'; 
                } else {
                    // Para cualquier otro rol (usuario común), redirigimos a 'index.html'
                    window.location.href = 'index.html';
                }
            }, 1500);
        } else {
            message.style.color = 'red';
            
            // Mensajes de error más específicos y variados
            if (response.status === 401) {
                const errorMessages = [
                    '❌ Usuario o contraseña incorrectos. Verifica tus datos',
                    '🚫 Credenciales inválidas. ¿Olvidaste tu contraseña?',
                    '⚠️ Los datos ingresados no coinciden con nuestros registros',
                    '🔍 No pudimos encontrar una cuenta con esas credenciales'
                ];
                message.textContent = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            } else if (response.status === 429) {
                message.textContent = '⏰ Demasiados intentos. Espera un momento antes de intentar nuevamente';
            } else if (response.status >= 500) {
                message.textContent = '🛠️ Problema temporal en nuestros servidores. Intenta en unos minutos';
            } else {
                message.textContent = result.message || '❗ Error inesperado. Contacta al soporte si persiste';
            }
        }
    } catch (error) {
        message.style.color = 'red';
        const connectionErrors = [
            '🌐 Sin conexión a internet. Verifica tu red',
            '📡 Error de conectividad. Revisa tu conexión',
            '⚡ Problema de red. Intenta nuevamente',
            '🔌 No se pudo conectar al servidor'
        ];
        message.textContent = connectionErrors[Math.floor(Math.random() * connectionErrors.length)];
        console.error('Error:', error);
    }
});