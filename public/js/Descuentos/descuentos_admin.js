class DescuentosAdmin {
    constructor() {
        this.currentPageDescuentos = 1;
        this.itemsPerPageDescuentos = 5;
        this.allDescuentos = [];
        this.init();
    }

    init() {
        this.loadDescuentos();
        this.cargarProductosEnSelect(); // Cargar productos al inicializar
        this.setupEventListeners();
    }

    setupEventListeners() {
        const form = document.getElementById('DescuentosForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Event listener para mostrar formulario de descuentos
        const btnMostrarFormulario = document.getElementById('btnMostrarFormularioDescuento');
        if (btnMostrarFormulario) {
            btnMostrarFormulario.addEventListener('click', () => {
                const formulario = document.getElementById('formularioDescuento');
                if (formulario) {
                    formulario.style.display = formulario.style.display === 'none' ? 'block' : 'none';
                    this.cargarProductosEnSelect();
                }
            });
        }

        // Event listener para cancelar formulario de descuentos
        const btnCancelar = document.getElementById('btnCancelarDescuento');
        if (btnCancelar) {
            btnCancelar.addEventListener('click', () => {
                const formulario = document.getElementById('formularioDescuento');
                if (formulario) {
                    this.refreshDescuentos();
                }
            });
        }

        // Paginación
        const prevBtn = document.getElementById('prevPageDescuentos');
        const nextBtn = document.getElementById('nextPageDescuentos');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPageDescuentos > 1) {
                    this.currentPageDescuentos--;
                    this.renderDescuentosPage();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.allDescuentos.length / this.itemsPerPageDescuentos);
                if (this.currentPageDescuentos < totalPages) {
                    this.currentPageDescuentos++;
                    this.renderDescuentosPage();
                }
            });
        }
    }

    async loadDescuentos(page = 1) {
        const resp = await fetch(`/api/descuentos?page=${page}`, {
            credentials: 'include'
        });
        try {
            const response = await fetch('/api/descuentos');
            if (response.ok) {
                const result = await response.json();
                this.allDescuentos = result.data || [];
            } else {
                console.warn('No se pudieron cargar los descuentos desde la API');
                this.allDescuentos = [];
            }
            this.renderDescuentosPage();
        } catch (error) {
            console.error('Error al cargar descuentos:', error);
            this.allDescuentos = [];
            this.renderDescuentosPage();
        }
    }

    renderDescuentosPage() {
        const startIndex = (this.currentPageDescuentos - 1) * this.itemsPerPageDescuentos;
        const endIndex = startIndex + this.itemsPerPageDescuentos;
        const descuentosToShow = this.allDescuentos.slice(startIndex, endIndex);

        this.renderDescuentos(descuentosToShow);
        this.renderPaginationDescuentos();
    }
    refreshDescuentos() {
        const formulario = document.getElementById('formularioDescuento');
        if (formulario) {
            formulario.style.display = 'none';
        }

        const descuentosForm = document.getElementById('DescuentosForm');
        if (descuentosForm) {
            descuentosForm.reset();
        }

        const descuentoId = document.getElementById('descuentoId');
        if (descuentoId) {
            descuentoId.value = '';
        }
    }

    async renderDescuentos(descuentos) {
        const tbody = document.getElementById('DescuentosList');
        if (!tbody) return;

        // Cargar solo productos que tienen descuentos
        let productos = [];
        try {
            // Obtener IDs únicos de productos con descuentos
            const productosConDescuentos = [...new Set(this.allDescuentos.map(d => d.producto_id))];

            if (productosConDescuentos.length > 0) {
                const response = await fetch('/api/productos');
                if (response.ok) {
                    const result = await response.json();
                    // Filtrar solo productos que tienen descuentos
                    productos = (result || []).filter(p =>
                        productosConDescuentos.includes(p.id)
                    );
                }
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }

        tbody.innerHTML = '';

        if (descuentos.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" style="text-align: center; padding: 20px; color: #666;">No hay descuentos registrados</td>';
            tbody.appendChild(row);
            return;
        }

        descuentos.forEach(descuento => {
            const producto = productos.find(p => p.id == descuento.producto_id);
            const productoNombre = producto ? producto.nombre : `Producto ID: ${descuento.producto_id}`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${descuento.id}</td>
                <td class="product-name-cell">
                    <div class="product-name-content">${productoNombre}</div>
                </td>
                <td>${descuento.cantidad_minima}</td>
                <td>${descuento.porcentaje_descuento}%</td>
                <td>
                    <span class="status-badge ${descuento.activo ? 'active' : 'inactive'}">
                        ${descuento.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn" onclick="window.descuentosAdminInstance.editDescuento(${descuento.id})">Editar</button>
                    <button class="btn" onclick="window.descuentosAdminInstance.deleteDescuento(${descuento.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderPaginationDescuentos() {
        const totalPages = Math.ceil(this.allDescuentos.length / this.itemsPerPageDescuentos);
        const paginationContainer = document.getElementById('paginationDescuentos');
        const pageNumbers = document.getElementById('pageNumbersDescuentos');
        const pageInfo = document.getElementById('pageInfoDescuentos');
        const prevBtn = document.getElementById('prevPageDescuentos');
        const nextBtn = document.getElementById('nextPageDescuentos');

        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        // Actualizar botones prev/next
        if (prevBtn) prevBtn.disabled = this.currentPageDescuentos === 1;
        if (nextBtn) nextBtn.disabled = this.currentPageDescuentos === totalPages;

        // Generar números de página
        if (pageNumbers) {
            pageNumbers.innerHTML = '';
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `pagination-btn ${i === this.currentPageDescuentos ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    this.currentPageDescuentos = i;
                    this.renderDescuentosPage();
                });
                pageNumbers.appendChild(pageBtn);
            }
        }

        // Información de página
        if (pageInfo) {
            const startItem = (this.currentPageDescuentos - 1) * this.itemsPerPageDescuentos + 1;
            const endItem = Math.min(this.currentPageDescuentos * this.itemsPerPageDescuentos, this.allDescuentos.length);
            pageInfo.textContent = `Mostrando ${startItem}-${endItem} de ${this.allDescuentos.length} descuentos`;
        }
    }

    async cargarProductosEnSelect(selectedProductId = null) {
        const select = document.getElementById('descuentoProductoSelect');
        if (!select) return;

        try {
            const response = await fetch('/api/productos');
            if (response.ok) {
                const result = await response.json();
                const productos = result || [];

                // Limpiar el select
                select.innerHTML = '<option value="">-- Selecciona un producto --</option>';

                // Agregar productos disponibles
                productos.forEach(producto => {
                    const option = document.createElement('option');
                    option.value = producto.id;
                    option.textContent = `${producto.nombre} (ID: ${producto.id})`;

                    if (selectedProductId && producto.id == selectedProductId) {
                        option.selected = true;
                    }

                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            select.innerHTML = '<option value="">Error al cargar productos</option>';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const descuentoData = {
            producto_id: parseInt(document.getElementById('descuentoProductoSelect').value),
            cantidad_minima: parseInt(document.getElementById('descuentoCantidadMinima').value),
            porcentaje_descuento: parseFloat(document.getElementById('descuentoPorcentaje').value),
            activo: document.getElementById('descuentoActivo').value === 'true'
        };

        const descuentoId = document.getElementById('descuentoId').value;

        let success = false;
        if (descuentoId) {
            descuentoData.id = parseInt(descuentoId);
            success = await this.updateDescuento(descuentoData);
        } else {
            success = await this.createDescuento(descuentoData);
        }

        if (success) {
            document.getElementById('formularioDescuento').style.display = 'none';
            document.getElementById('DescuentosForm').reset();
            document.getElementById('descuentoId').value = '';
            document.getElementById('submitBtnDescuento').innerText = 'Crear Descuento';
            await this.loadDescuentos();
        }
    }

    async createDescuento(data) {
        const resp = await fetch('/api/descuentos', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('Descuento creado exitosamente');
            return true;
        } else {
            console.error('Error al crear descuento:', result.message);
            return false;
        }
    }

    async updateDescuento(descuentoData) {
        try {
            console.log(descuentoData)
            const response = await fetch(`/api/descuentos/${descuentoData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(descuentoData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                console.log('Descuento actualizado exitosamente');
                return true;
            } else {
                console.error('Error al actualizar descuento:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error al actualizar descuento:', error);
            return false;
        }
    }

    async deleteDescuento(id) {
        if (confirm('¿Estás seguro de eliminar este descuento?')) {
            try {
                const response = await fetch(`/api/descuentos/${id}`, {
                    method: 'DELETE'
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    console.log('Descuento eliminado exitosamente');
                    await this.loadDescuentos();
                    return true;
                } else {
                    console.error('Error al eliminar descuento:', result.message);
                    return false;
                }
            } catch (error) {
                console.error('Error al eliminar descuento:', error);
                return false;
            }
        }
        return false;
    }

    async editDescuento(id) {
        const descuento = this.allDescuentos.find(d => d.id == id);
        if (descuento) {
            // Primero cargar productos y luego establecer valores
            await this.cargarProductosEnSelect(descuento.producto_id);

            document.getElementById('descuentoId').value = descuento.id;
            document.getElementById('descuentoCantidadMinima').value = descuento.cantidad_minima;
            document.getElementById('descuentoPorcentaje').value = descuento.porcentaje_descuento;
            document.getElementById('descuentoActivo').value = descuento.activo.toString();
            document.getElementById('submitBtnDescuento').innerText = 'Actualizar Descuento';
            document.getElementById('formularioDescuento').style.display = 'block';

            // Scroll suave al formulario
            document.getElementById('formularioDescuento').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }

    getNextId() {
        return this.allDescuentos.length > 0 ? Math.max(...this.allDescuentos.map(d => d.id)) + 1 : 1;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.descuentosAdminInstance = new DescuentosAdmin();
});