// --- Utilidades ---
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmtMoney = (n) => new Intl.NumberFormat("es-MX", { style:"currency", currency:"MXN", maximumFractionDigits:2 }).format(n);
const fmtDate = (iso) => new Date(iso).toLocaleDateString("es-MX", { year:"numeric", month:"short", day:"2-digit" });

// --- Fetch real data from API ---
async function fetchOrders() {
  const response = await fetch('/api/historial');
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  
  // Los datos ya vienen en el formato correcto desde la API
  return data;
}

// --- Estado y render ---
let ORDERS = [];
let FILTER = "";

const elLoading = $("#loading");
const elError = $("#error");
const elEmpty = $("#empty");
const elCard = $("#historialCard");
const elBody = $("#historialBody");
const elFilter = $("#estadoFilter");
const modal = $("#detailsModal");

// Agregar las variables del modal que faltan
const modalTitle = $("#modalTitle");
const modalSubtitle = $("#modalSubtitle");
const modalStatus = $("#modalStatus");
const modalTotal = $("#modalTotal");
const modalUser = $("#modalUser");
const modalPaymentId = $("#modalPaymentId");
const modalUserPhone = $("#modalUserPhone");
const modalUserAddress = $("#modalUserAddress");
const modalUserLocation = $("#modalUserLocation");
const modalSubtotal = $("#modalSubtotal");
const modalDiscounts = $("#modalDiscounts");
const modalFinalTotal = $("#modalFinalTotal");
const modalItems = $("#modalItems");

async function load() {
  showOnly(elLoading);
  try {
    elError.classList.add("hidden");
    const data = await fetchOrders();
    ORDERS = data;
    render();
  } catch (e) {
    $("#errorMessage").textContent = e?.message || "Error al cargar el historial";
    showOnly(elError);
  }
}

function showOnly(node) {
  for (const el of [elLoading, elError, elEmpty, elCard]) el.classList.add("hidden");
  if (node) node.classList.remove("hidden");
}

// Función para actualizar estado de venta
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/api/historial/${orderId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado: newStatus })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Actualizar el estado en la lista local
    const order = ORDERS.find(o => o.id === orderId);
    if (order) {
      order.status = newStatus;
      render(); // Re-renderizar la tabla
    }
    
    alert(`Estado actualizado a: ${newStatus}`);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    alert('Error al actualizar el estado del pedido');
  }
}

function rowHtml(o, idx) {
  return `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.usuario_nombre}</td>
      <td>${new Date(o.fecha).toLocaleDateString('es-ES')}</td>
      <td><strong>$${o.total.toLocaleString('es-CL')}</strong></td>
      <td>
        <select class="status-select" 
                data-order-id="${o.id}" 
                onchange="handleStatusChange(this)">
          <option value="pendiente" ${o.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="completada" ${o.estado === 'completada' ? 'selected' : ''}>Completada</option>
          <option value="cancelada" ${o.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
        </select>
      </td>
      <td class="text-right">
        <button class="btn btn-sm btn-ghost" onclick="openDetails('${o.id}')" title="Ver detalles">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6"/></svg>
          Ver Detalles
        </button>
      </td>
    </tr>
  `;
}

// Función para manejar el cambio de estado
function handleStatusChange(selectElement) {
  const orderId = selectElement.dataset.orderId;
  const newStatus = selectElement.value;
  const currentOrder = ORDERS.find(o => o.id == orderId);
  
  if (!currentOrder || currentOrder.estado === newStatus) {
    return; // No hay cambio
  }
  
  const statusLabels = {
    'pendiente': 'Pendiente',
    'completada': 'Completada', 
    'cancelada': 'Cancelada'
  };
  
  const confirmMessage = `¿Está seguro de cambiar el estado del pedido #${orderId} a "${statusLabels[newStatus]}"?`;
  
  if (confirm(confirmMessage)) {
    // Actualizar el estado
    updateOrderStatus(orderId, newStatus);
  } else {
    // Revertir la selección si el usuario cancela
    selectElement.value = currentOrder.estado;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/api/historial/${orderId}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ estado: newStatus })
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    // Actualizar el estado en la lista local
    const order = ORDERS.find(o => o.id == orderId);
    if (order) {
      order.estado = newStatus;
      render(); // Re-renderizar la tabla
    }
    
    // Mostrar mensaje de éxito más discreto
    console.log(`Estado actualizado a: ${newStatus}`);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    alert('Error al actualizar el estado del pedido');
    
    // Revertir el select al estado anterior en caso de error
    const selectElement = document.querySelector(`select[data-order-id="${orderId}"]`);
    if (selectElement) {
      const currentOrder = ORDERS.find(o => o.id == orderId);
      if (currentOrder) {
        selectElement.value = currentOrder.estado;
      }
    }
  }
}

function statusBadge(st) {
  const map = {
    completada: { cls:"bg-green", label:"completada",
      icon:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' },
    pendiente: { cls:"bg-amber", label:"pendiente",
      icon:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 7h18"/></svg>' },
    cancelada: { cls:"bg-red", label:"cancelada",
      icon:'<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' },
  };
  const b = map[st] || map.pendiente;
  return `<span class="badge ${b.cls}">${b.icon}<span>${b.label}</span></span>`;
}

function render() {
  const rows = (FILTER ? ORDERS.filter(o => o.status === FILTER) : ORDERS);
  if (rows.length === 0) {
    showOnly(elEmpty);
    return;
  }

  elBody.innerHTML = rows.map((o, idx) => rowHtml(o, idx)).join("");
  
  // Bind actions
  $$("#historialBody .btn-view").forEach(btn => {
    btn.addEventListener("click", () => openDetails(parseInt(btn.dataset.id, 10)));
  });
  
  // Bind checkbox status change actions
  $$("#historialBody .status-checkbox").forEach(checkbox => {
    checkbox.addEventListener("change", (e) => {
      const orderId = parseInt(e.target.dataset.id, 10);
      const newStatus = e.target.dataset.status;
      const isChecked = e.target.checked;
      
      if (isChecked) {
        // Desmarcar otros checkboxes del mismo pedido
        const otherCheckboxes = document.querySelectorAll(`input.status-checkbox[data-id="${orderId}"]`);
        otherCheckboxes.forEach(cb => {
          if (cb !== e.target) {
            cb.checked = false;
          }
        });
        
        // Confirmar y actualizar estado
        if (confirm(`¿Estás seguro de cambiar el estado a "${newStatus}"?`)) {
          updateOrderStatus(orderId, newStatus);
        } else {
          // Si cancela, desmarcar el checkbox
          e.target.checked = false;
          // Volver a marcar el estado actual
          const currentOrder = ORDERS.find(o => o.id === orderId);
          if (currentOrder) {
            const currentCheckbox = document.querySelector(`input.status-checkbox[data-id="${orderId}"][data-status="${currentOrder.status}"]`);
            if (currentCheckbox) {
              currentCheckbox.checked = true;
            }
          }
        }
      } else {
        // Si desmarca, no hacer nada (debe tener al menos un estado)
        e.target.checked = true;
      }
    });
  });

  showOnly(elCard);
}

function openDetails(id) {
  const o = ORDERS.find(x => x.id == id);
  if (!o) return;
  
  // Información básica del pedido
  modalTitle.textContent = "Detalles del pedido";
  modalSubtitle.textContent = `ID #${o.id} • ${new Date(o.fecha).toLocaleString("es-ES")} • ${o.detalles.length} artículo${o.detalles.length !== 1 ? 's' : ''}`;
  
  // Estado del pedido - restaurar el uso de statusBadge para mostrar los estilos originales
  modalStatus.innerHTML = statusBadge(o.estado);
  
  // Información del usuario
  modalUser.textContent = `Usuario: ${o.usuario_nombre || `Usuario #${o.usuario_id}`}`;
  
  // Información adicional del usuario
  if (o.usuario_telefono) {
    modalUserPhone.textContent = `Teléfono: ${o.usuario_telefono}`;
    modalUserPhone.style.display = 'block';
  } else {
    modalUserPhone.style.display = 'none';
  }
  
  if (o.usuario_direccion) {
    modalUserAddress.textContent = `Dirección: ${o.usuario_direccion}`;
    modalUserAddress.style.display = 'block';
  } else {
    modalUserAddress.style.display = 'none';
  }
  
  if (o.usuario_ciudad && o.usuario_region) {
    modalUserLocation.textContent = `Ubicación: ${o.usuario_ciudad}, ${o.usuario_region}`;
    modalUserLocation.style.display = 'block';
  } else {
    modalUserLocation.style.display = 'none';
  }
  
  // ID de pago (si existe)
  if (o.payment_id) {
    modalPaymentId.textContent = `ID de Pago: ${o.payment_id}`;
    modalPaymentId.style.display = 'inline';
  } else {
    modalPaymentId.style.display = 'none';
  }
  
  // Calcular subtotales y descuentos
  let subtotalProductos = 0;
  let totalDescuentos = 0;
  
  o.detalles.forEach(detalle => {
    subtotalProductos += (detalle.precio_unitario * detalle.cantidad);
    totalDescuentos += (detalle.descuento || 0) * detalle.cantidad;
  });
  
  // Mostrar resumen financiero
  modalSubtotal.textContent = `$${subtotalProductos.toLocaleString('es-CL')}`;
  modalDiscounts.textContent = totalDescuentos > 0 ? `-$${totalDescuentos.toLocaleString('es-CL')}` : '$0';
  modalFinalTotal.textContent = `$${o.total.toLocaleString('es-CL')}`;
  modalTotal.textContent = `Total: $${o.total.toLocaleString('es-CL')}`;
  
  // Mostrar artículos con información detallada
  modalItems.innerHTML = o.detalles.map(detalle => {
    const precioOriginal = detalle.precio_unitario;
    const descuentoUnitario = detalle.descuento || 0;
    const precioConDescuento = precioOriginal - descuentoUnitario;
    const subtotalOriginal = precioOriginal * detalle.cantidad;
    const subtotalFinal = detalle.subtotal;
    
    return `
      <div class="item" style="border-bottom: 1px solid #eee; padding: 12px 0; display: flex; align-items: center;">
        <img src="${detalle.imagen_url || "/images/productos/default.jpg"}" 
             alt="Imagen de ${detalle.producto}" 
             crossorigin="anonymous" 
             style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
        <div style="flex:1; margin-left: 12px;">
          <div class="item-name" style="font-weight: 600; margin-bottom: 4px;">${detalle.producto}</div>
          <div class="item-details" style="font-size: 0.9em; color: #666;">
            <div>Cantidad: <strong>${detalle.cantidad}</strong></div>
            <div>Precio unitario: <strong>$${precioOriginal.toLocaleString('es-CL')}</strong></div>
            ${descuentoUnitario > 0 ? `<div style="color: #dc3545;">Descuento: -$${descuentoUnitario.toLocaleString('es-CL')} por unidad</div>` : ''}
            ${descuentoUnitario > 0 ? `<div>Precio final: <strong>$${precioConDescuento.toLocaleString('es-CL')}</strong></div>` : ''}
          </div>
        </div>
        <div class="item-pricing" style="text-align: right;">
          ${descuentoUnitario > 0 && subtotalOriginal !== subtotalFinal ? 
            `<div style="text-decoration: line-through; color: #999; font-size: 0.9em;">$${subtotalOriginal.toLocaleString('es-CL')}</div>` : 
            ''}
          <div style="font-weight: 700; font-size: 1.1em;">$${subtotalFinal.toLocaleString('es-CL')}</div>
        </div>
      </div>
    `;
  }).join("");
  
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
}

// --- Eventos ---
$("#retryBtn").addEventListener("click", load);
$("#reloadBtn").addEventListener("click", load);
$("#logoutBtn").addEventListener("click", () => {
  // Implementar logout real
  window.location.href = 'login.html';
});
elFilter.addEventListener("change", () => {
  FILTER = elFilter.value;
  render();
});
modal.addEventListener("click", (e) => {
  if (e.target.hasAttribute("data-close") || e.target === $(".modal-backdrop", modal)) closeModal();
});
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  load();
});