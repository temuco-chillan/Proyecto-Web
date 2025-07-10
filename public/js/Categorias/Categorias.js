document.getElementById('formCategoria').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombre = document.getElementById('nombreCategoria').value.trim();
  const mensaje = document.getElementById('mensajeCategoria');

  if (!nombre) {
    mensaje.textContent = 'El nombre no puede estar vacío.';
    return;
  }

  try {
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre })
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Error desconocido');
    }

    const nuevaCategoria = await res.json();
    mensaje.textContent = `✅ Categoría "${nuevaCategoria.nombre}" creada con éxito.`;

    // Opcional: limpiar campo
    document.getElementById('nombreCategoria').value = '';

  } catch (err) {
    mensaje.textContent = `❌ Error al crear categoría: ${err.message}`;
    console.error(err);
  }
});
