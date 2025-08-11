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
  
  // Transformar datos para que coincidan con el formato esperado
  return data.map(venta => ({
    id: venta.id,
    date: venta.fecha,
    total: venta.total,
    status: venta.estado,
    usuario_id: venta.usuario_id,
    usuario_nombre: venta.usuario_nombre,
    payment_id: venta.payment_id,
    items: venta.detalles.map(detalle => ({
      id: detalle.producto_id,
      name: detalle.producto,
      qty: detalle.cantidad,
      price: detalle.precio_unitario,
      image: detalle.imagen_url || "/images/productos/default.jpg"
    }))
  }));
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

  showOnly(elCard);
}

function rowHtml(o, idx) {
  const badge = statusBadge(o.status);
  return `
    <tr class="${idx % 2 === 0 ? "" : ""}">
      <td>${o.id}</td>
      <td>${o.usuario_nombre || `Usuario #${o.usuario_id}`}</td>
      <td>${fmtDate(o.date)}</td>
      <td>${fmtMoney(o.total)}</td>
      <td>${badge}</td>
      <td class="text-right">
        <button class="btn btn-red btn-view" data-id="${o.id}" type="button">
          <!-- eye icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Ver detalles
        </button>
      </td>
    </tr>
  `;
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

// --- Modal ---
const modal = $("#detailsModal");
const modalTitle = $("#modalTitle");
const modalSubtitle = $("#modalSubtitle");
const modalStatus = $("#modalStatus");
const modalTotal = $("#modalTotal");
const modalUser = $("#modalUser");
const modalItems = $("#modalItems");

function openDetails(id) {
  const o = ORDERS.find(x => x.id === id);
  if (!o) return;
  modalTitle.textContent = "Detalles del pedido";
  modalSubtitle.textContent = `ID #${o.id} • ${new Date(o.date).toLocaleString("es-MX")}`;
  modalStatus.className = "badge " + (o.status === "completada" ? "bg-green" : o.status === "cancelada" ? "bg-red" : "bg-amber");
  modalStatus.innerHTML = statusBadge(o.status);
  modalTotal.textContent = `Total: ${fmtMoney(o.total)}`;
  modalUser.textContent = `Usuario: ${o.usuario_nombre || `Usuario #${o.usuario_id}`}`;
  modalItems.innerHTML = o.items.map(it => `
    <div class="item">
      <img src="${it.image || "/placeholder.svg?height=48&width=48"}" alt="Imagen de ${it.name}" crossorigin="anonymous" />
      <div style="flex:1">
        <div class="item-name">${it.name}</div>
        <div class="item-sub">Cantidad: ${it.qty} · Subtotal: ${fmtMoney(it.qty * it.price)}</div>
      </div>
      <div style="font-weight:700">${fmtMoney(it.price)}</div>
    </div>
  `).join("");
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