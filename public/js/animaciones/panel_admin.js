window.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});

// Accesibilidad: permitir cerrar modal con [data-close]
document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-close]');
    if (target) {
        const modal = document.getElementById('detailsModal');
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
    }
});