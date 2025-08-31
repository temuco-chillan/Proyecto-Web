// Frontend JavaScript para manejo del historial
class HistorialManager {
    constructor() {
        this.baseURL = window.location.origin;
    }

    async getHistorial(usuarioId) {
        try {
            const response = await fetch(`${this.baseURL}/api/historial/${usuarioId}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener historial:', error);
            throw error;
        }
    }

    async getAllHistorial() {
        try {
            const response = await fetch(`${this.baseURL}/api/historial`);
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener todo el historial:', error);
            throw error;
        }
    }

    async crearVenta(usuarioId, detalles, paymentId = null) {
        try {
            const response = await fetch(`${this.baseURL}/api/historial`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usuario_id: usuarioId,
                    detalles: detalles,
                    payment_id: paymentId
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al crear venta:', error);
            throw error;
        }
    }

    async actualizarEstadoVenta(ventaId, estado) {
        try {
            const response = await fetch(`${this.baseURL}/api/historial/${ventaId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: estado })
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            throw error;
        }
    }
}

// Exportar para uso global
window.HistorialManager = HistorialManager;