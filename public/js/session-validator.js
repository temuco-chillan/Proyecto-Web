// ========================
// VALIDADOR DE SESIÓN AUTOMÁTICO
// ========================

// Variable global para el usuario actual
let currentUser = null;

// Función para validar sesión automáticamente
async function checkUserSession() {
    try {
        console.log('🔍 Verificando sesión del usuario...');
        
        // Verificar sesión en el servidor PRIMERO
        const response = await fetch('/api/users/me', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const userData = await response.json();
            // Crear estructura consistente
            currentUser = { 
                user: {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role || userData.rol,
                    rol_id: userData.rol_id || userData.role_id
                }
            };
            
            // Sincronizar con localStorage y window
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            window.currentUser = currentUser;
            
            console.log('✅ Sesión del servidor detectada:', currentUser);
            
            // Actualizar interfaz si la función existe
            if (typeof updateHeaderUserInterface === 'function') {
                updateHeaderUserInterface();
            }
            
            return true;
        } else {
            // Si no hay sesión en servidor, verificar localStorage como fallback
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    currentUser = JSON.parse(storedUser);
                    window.currentUser = currentUser;
                    console.log('ℹ️ Usando sesión de localStorage:', currentUser);
                    
                    // Actualizar interfaz si la función existe
                    if (typeof updateHeaderUserInterface === 'function') {
                        updateHeaderUserInterface();
                    }
                    
                    return true;
                } catch (e) {
                    console.error('❌ Error al parsear usuario de localStorage:', e);
                    localStorage.removeItem('currentUser');
                }
            }
            
            currentUser = null;
            window.currentUser = null;
            console.log('❌ No hay sesión activa');
            
            // Actualizar interfaz para mostrar estado sin sesión
            if (typeof updateHeaderUserInterface === 'function') {
                updateHeaderUserInterface();
            }
            
            return false;
        }
    } catch (error) {
        console.error('❌ Error al verificar sesión:', error);
        
        // Fallback a localStorage en caso de error de red
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
                window.currentUser = currentUser;
                console.log('ℹ️ Usando sesión de localStorage (fallback por error de red):', currentUser);
                
                // Actualizar interfaz si la función existe
                if (typeof updateHeaderUserInterface === 'function') {
                    updateHeaderUserInterface();
                }
                
                return true;
            } catch (e) {
                localStorage.removeItem('currentUser');
            }
        }
        
        currentUser = null;
        window.currentUser = null;
        return false;
    }
}

// Función para limpiar sesión
function clearUserSession() {
    currentUser = null;
    window.currentUser = null;
    localStorage.removeItem('currentUser');
    console.log('🧹 Sesión limpiada');
    
    // Actualizar interfaz si la función existe
    if (typeof updateHeaderUserInterface === 'function') {
        updateHeaderUserInterface();
    }
}

// Función para obtener el usuario actual
function getCurrentUser() {
    return window.currentUser || currentUser || JSON.parse(localStorage.getItem('currentUser') || 'null');
}

// Validación automática al cargar el DOM
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando validación automática de sesión...');
    await checkUserSession();
    console.log('✅ Validación de sesión completada');
});

// Exponer funciones globalmente
window.checkUserSession = checkUserSession;
window.clearUserSession = clearUserSession;
window.getCurrentUser = getCurrentUser;
window.currentUser = currentUser;

// Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkUserSession,
        clearUserSession,
        getCurrentUser
    };
}