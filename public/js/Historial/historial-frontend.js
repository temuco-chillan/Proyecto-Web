class HistorialManager {
    constructor() {
        this.baseURL = window.location.origin;
    }

    async getHistorial(userId) {
        const resp = await fetch(`/api/historial/${userId}`, {
            credentials: 'include'
        });
        return resp.json();
    }

    async getAllHistorial() {
        const resp = await fetch('/api/historial', {
            credentials: 'include'
        });
        return resp.json();
    }

    async crearVenta(payload) {
        const resp = await fetch('/api/historial', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return resp.json();
    }

    async actualizarEstadoVenta(id, estado) {
        const resp = await fetch(`/api/historial/${id}/estado`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado })
        });
        return resp.json();
    }
}

// Exportar para uso global
window.HistorialManager = HistorialManager;