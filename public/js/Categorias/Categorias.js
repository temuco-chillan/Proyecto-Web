document.getElementById('formCategoria').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombre = document.getElementById('nombreCategoria').value.trim();
  const mensaje = document.getElementById('mensajeCategoria');

  if (!nombre) {
    mensaje.textContent = '⚠️ El nombre no puede estar vacío.';
    return;
  }

  try {
    const resp = await fetch('/api/categorias', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Error desconocido');
    }

    const nuevaCategoria = await res.json();
    mensaje.textContent = `✅ Categoría "${nuevaCategoria.nombre}" creada con éxito.`;

    document.getElementById('nombreCategoria').value = '';

    // Recargar combo si existe
    if (typeof fetchCategorias === 'function') {
      fetchCategorias();
    }

  } catch (err) {
    console.error('❌ Error al crear categoría:', err);
    mensaje.textContent = `❌ Error al crear categoría: ${err.message}`;
  }
});
