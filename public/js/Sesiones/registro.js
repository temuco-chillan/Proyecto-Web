document.getElementById('registerForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const username       = document.getElementById('username').value.trim();
  const nombreCompleto = document.getElementById('nombreCompleto').value.trim();
  const email          = document.getElementById('email').value.trim();
  const password       = document.getElementById('password').value.trim();
  let   rut            = document.getElementById('rut').value.trim();
  const telefono       = document.getElementById('telefono').value.trim();
  const direccion      = document.getElementById('direccion').value.trim();
  const ciudad         = document.getElementById('ciudad').value.trim();
  const region         = document.getElementById('region').value.trim();
  const message        = document.getElementById('message');

  // -------- Validaciones --------
  if (!username) {
    message.style.color = 'red';
    message.textContent = '👤 El nombre de usuario es obligatorio';
    return;
  }
  if (username.length < 3) {
    message.style.color = 'red';
    message.textContent = '📏 El nombre de usuario debe tener al menos 3 caracteres';
    return;
  }
  if (username.length > 20) {
    message.style.color = 'red';
    message.textContent = '📏 El nombre de usuario no puede exceder 20 caracteres';
    return;
  }
  if (!email) {
    message.style.color = 'red';
    message.textContent = '📧 El correo electrónico es obligatorio';
    return;
  }
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) {
    message.style.color = 'red';
    message.textContent = '📧 Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)';
    return;
  }
  if (!password) {
    message.style.color = 'red';
    message.textContent = '🔒 La contraseña es obligatoria';
    return;
  }
  if (password.length < 6) {
    message.style.color = 'red';
    message.textContent = '🔐 La contraseña debe tener al menos 6 caracteres';
    return;
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    message.style.color = 'orange';
    message.textContent = '💡 Recomendación: Usa mayúsculas, minúsculas y números para mayor seguridad';
    // advertencia, no detenemos el flujo
  }
  if (!rut) {
    message.style.color = 'red';
    message.textContent = '🆔 El RUT es obligatorio';
    return;
  }
  if (!validateRut(rut)) {
    message.style.color = 'red';
    const rutErrors = [
      '🆔 El número identificador no coincide con el RUT ingresado',
      '❌ RUT inválido. Verifica que esté correctamente digitado',
      '🔍 El RUT ingresado no es válido. Revisa los datos'
    ];
    message.textContent = rutErrors[Math.floor(Math.random() * rutErrors.length)];
    return;
  }
  if (!telefono) {
    message.style.color = 'red';
    message.textContent = '📱 El teléfono es obligatorio';
    return;
  }
  const telefonoPattern = /^[0-9]{8,15}$/;
  if (!telefonoPattern.test(telefono)) {
    message.style.color = 'red';
    if (telefono.length < 8) {
      message.textContent = '📱 El teléfono debe tener al menos 8 dígitos';
    } else if (telefono.length > 15) {
      message.textContent = '📱 El teléfono no puede tener más de 15 dígitos';
    } else {
      message.textContent = '📱 El teléfono solo debe contener números (sin espacios ni guiones)';
    }
    return;
  }
  if (!direccion) {
    message.style.color = 'red';
    message.textContent = '🏠 La dirección es obligatoria';
    return;
  }
  if (direccion.length < 10) {
    message.style.color = 'red';
    message.textContent = '🏠 Ingresa una dirección más específica (mínimo 10 caracteres)';
    return;
  }
  if (!ciudad) {
    message.style.color = 'red';
    message.textContent = '🏙️ La ciudad es obligatoria';
    return;
  }
  if (!region) {
    message.style.color = 'red';
    message.textContent = '🗺️ Selecciona tu región';
    return;
  }

  // Normaliza RUT (por el dígito K/k)
  rut = rut.toUpperCase();

  // -------- Llamada al backend --------
  message.style.color = '#2196F3';
  message.textContent = '⏳ Creando tu cuenta...';

  try {
    const userData = {
      username,
      nombreCompleto,
      email,
      password,
      rut,
      telefono,
      direccion,
      ciudad,
      region
    };

    const resp = await fetch('/api/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData) // <<< enviar el objeto correcto
    });

    const result = await resp.json().catch(() => ({}));

    if (resp.ok) {
      message.style.color = 'green';
      const successMessages = [
        '🎉 ¡Cuenta creada exitosamente! Redirigiendo al login...',
        '✅ ¡Bienvenido! Tu registro se completó correctamente',
        '🚀 ¡Perfecto! Tu cuenta está lista. Iniciando sesión...',
        '👋 ¡Registro exitoso! Te llevamos al login'
      ];
      message.textContent = successMessages[Math.floor(Math.random() * successMessages.length)];
      setTimeout(() => (window.location.href = 'login.html'), 2000);
    } else {
      message.style.color = 'red';
      if (resp.status === 409) {
        if (/usuario/i.test(result.message)) {
          const usernameErrors = [
            '👤 Este nombre de usuario ya existe. Prueba con otro',
            '❌ Nombre de usuario no disponible. Elige uno diferente',
            '🔍 Ya hay una cuenta con este usuario. Intenta otro nombre'
          ];
          message.textContent = usernameErrors[Math.floor(Math.random() * usernameErrors.length)];
        } else if (/correo|email/i.test(result.message)) {
          const emailErrors = [
            '📧 Este correo ya está registrado. ¿Ya tienes cuenta?',
            '❌ Email no disponible. Usa otro correo electrónico',
            '🔍 Ya existe una cuenta con este email'
          ];
          message.textContent = emailErrors[Math.floor(Math.random() * emailErrors.length)];
        } else if (/RUT/i.test(result.message)) {
          message.textContent = '🆔 Este RUT ya está registrado';
        } else {
          message.textContent = result.message || '❗ Conflicto de datos';
        }
      } else if (resp.status === 400) {
        message.textContent = '⚠️ Datos incompletos o inválidos. Revisa todos los campos';
      } else if (resp.status >= 500) {
        message.textContent = '🛠️ Error temporal del servidor. Intenta nuevamente en unos minutos';
      } else {
        message.textContent = result.message || '❗ Error inesperado. Contacta al soporte';
      }
    }
  } catch (error) {
    console.error('Error:', error);
    message.style.color = 'red';
    const connectionErrors = [
      '🌐 Sin conexión a internet. Verifica tu red',
      '📡 Error de conectividad. Revisa tu conexión',
      '⚡ Problema de red. Intenta nuevamente'
    ];
    message.textContent = connectionErrors[Math.floor(Math.random() * connectionErrors.length)];
  }
});

// -------- Validación de RUT --------
function validateRut(rut) {
  if (!rut || rut.trim() === '') return false;
  rut = rut.trim();
  const rutPattern = /^[0-9]+-[0-9kK]{1}$/;
  if (!rutPattern.test(rut)) return false;

  const [rutBody, verifier] = rut.split('-');
  if (rutBody.length < 7 || rutBody.length > 8) return false;

  const calculatedVerifier = calculateRutVerifier(rutBody);
  return verifier.toUpperCase() === calculatedVerifier.toUpperCase();
}

function calculateRutVerifier(rutBody) {
  let sum = 0;
  let multiplier = 2;
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = sum % 11;
  const verifier = 11 - remainder;
  if (verifier === 11) return '0';
  if (verifier === 10) return 'K';
  return verifier.toString();
}

// -------- Formateo de RUT en tiempo real --------
function formatRut(input) {
  let value = input.value.replace(/[^0-9kK]/g, '');
  if (value.length > 9) value = value.substring(0, 9);
  if (value.length > 1) value = value.slice(0, -1) + '-' + value.slice(-1);
  input.value = value;
}

document.getElementById('rut').addEventListener('input', function () {
  formatRut(this);
});

// Utilidad: ejemplos de RUTs válidos
function getValidRutExamples() {
  return ['11111111-1', '12345678-5', '98765432-1', '87654321-4', '23456789-K'];
}
