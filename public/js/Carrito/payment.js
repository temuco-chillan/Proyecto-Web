// Datos mock para simular diferentes estados de pago
const mockPaymentData = {
  success: {
    orderId: "ORD-2024-001",
    amount: 8000.0,
    items: [{ name: "Laptop", price: 8000.0, quantity: 1 }],
    paymentMethod: "Tarjeta de Crédito **** 1234",
    transactionId: "TXN-789456123",
  },
  rejected: {
    orderId: "ORD-2024-002",
    reason: "Fondos insuficientes en la tarjeta",
  },
  pending: {
    orderId: "ORD-2024-003",
    amount: 322222.0,
    items: [{ name: "Secadora", price: 322222.0, quantity: 1 }],
  },
}

// Estado actual de la aplicación
let currentStatus = null

// Elementos del DOM
const simulator = document.getElementById("simulator")
const paymentResult = document.getElementById("payment-result")
const btnSuccess = document.getElementById("btn-success")
const btnRejected = document.getElementById("btn-rejected")
const btnPending = document.getElementById("btn-pending")
const btnBack = document.getElementById("btn-back")
const btnAction = document.getElementById("btn-action")

// Función para formatear moneda
function formatCurrency(amount) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
  }).format(amount)
}

// Función para obtener configuración según el estado
function getStatusConfig(status) {
  const configs = {
    success: {
      title: "¡Pago Exitoso!",
      subtitle: "Tu compra ha sido procesada correctamente",
      bgClass: "bg-green-50",
      iconClass: "success",
      titleClass: "success",
      actionText: "Continuar Comprando",
    },
    rejected: {
      title: "Pago Rechazado",
      subtitle: "No se pudo procesar tu pago",
      bgClass: "bg-red-50",
      iconClass: "rejected",
      titleClass: "rejected",
      actionText: "Intentar Nuevamente",
    },
    pending: {
      title: "Pago Pendiente",
      subtitle: "Tu registro fue exitoso, pero el pago está pendiente",
      bgClass: "bg-yellow-50",
      iconClass: "pending",
      titleClass: "pending",
      actionText: "Ver Estado del Pago",
    },
  }
  return configs[status]
}

// Función para mostrar el resultado del pago
function showPaymentResult(status) {
  currentStatus = status
  const config = getStatusConfig(status)
  const data = mockPaymentData[status]

  // Ocultar simulador y mostrar resultado
  simulator.classList.add("hidden")
  paymentResult.classList.remove("hidden")

  // Aplicar clase de fondo
  paymentResult.className = `min-h-screen flex-center p-4 ${config.bgClass}`

  // Configurar icono y títulos
  const statusIcon = document.getElementById("status-icon")
  const statusTitle = document.getElementById("status-title")
  const statusSubtitle = document.getElementById("status-subtitle")

  statusIcon.className = `status-icon ${config.iconClass}`
  statusTitle.textContent = config.title
  statusTitle.className = `status-title ${config.titleClass}`
  statusSubtitle.textContent = config.subtitle

  // Mostrar número de orden
  document.getElementById("order-id").textContent = data.orderId

  // Generar contenido dinámico
  generateDynamicContent(status, data)

  // Configurar botón de acción
  btnAction.textContent = config.actionText
  btnAction.className = `btn flex-1 btn-${status}`
}

// Función para generar contenido dinámico según el estado
function generateDynamicContent(status, data) {
  const dynamicContent = document.getElementById("dynamic-content")
  let html = ""

  if (status === "success" && data.items) {
    html = `
            <div class="separator"></div>
            <div class="purchase-details">
                <h3>Detalles de la Compra</h3>
                <div class="item-list">
                    ${data.items
                      .map(
                        (item) => `
                        <div class="item">
                            <div class="item-info">
                                <h4>${item.name}</h4>
                                <p>Cantidad: ${item.quantity}</p>
                            </div>
                            <div class="item-price">${formatCurrency(item.price)}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="separator"></div>
                <div class="total-section">
                    <span>Total Pagado:</span>
                    <span class="total-amount success">${formatCurrency(data.amount)}</span>
                </div>
            </div>
            <div class="separator"></div>
            <div class="payment-info">
                <div class="payment-header">
                    <span>💳</span>
                    <span>Método de Pago</span>
                </div>
                <p class="payment-method">${data.paymentMethod}</p>
                <p class="transaction-id">ID de Transacción: ${data.transactionId}</p>
            </div>
        `
  } else if (status === "rejected") {
    html = `
            <div class="separator"></div>
            <div class="alert error">
                <h3>Motivo del Rechazo</h3>
                <p>${data.reason}</p>
            </div>
            <div class="info-text">
                <p>Por favor, verifica tu información de pago e intenta nuevamente.</p>
            </div>
        `
  } else if (status === "pending" && data.items) {
    html = `
            <div class="separator"></div>
            <div class="alert warning">
                <h3>Estado del Registro</h3>
                <p>Tu registro ha sido exitoso, pero el pago aún está siendo procesado.</p>
            </div>
            <div class="purchase-details">
                <h3>Resumen del Pedido</h3>
                <div class="item-list">
                    ${data.items
                      .map(
                        (item) => `
                        <div class="item">
                            <div class="item-info">
                                <h4>${item.name}</h4>
                                <p>Cantidad: ${item.quantity}</p>
                            </div>
                            <div class="item-price">${formatCurrency(item.price)}</div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
                <div class="separator"></div>
                <div class="total-section">
                    <span>Total a Pagar:</span>
                    <span class="total-amount pending">${formatCurrency(data.amount)}</span>
                </div>
            </div>
            <div class="info-text">
                <p>Recibirás una notificación una vez que se complete el pago.</p>
            </div>
        `
  }

  dynamicContent.innerHTML = html
}

// Función para volver al simulador
function showSimulator() {
  paymentResult.classList.add("hidden")
  simulator.classList.remove("hidden")
  currentStatus = null
}

// Event listeners
btnSuccess.addEventListener("click", () => showPaymentResult("success"))
btnRejected.addEventListener("click", () => showPaymentResult("rejected"))
btnPending.addEventListener("click", () => showPaymentResult("pending"))
btnBack.addEventListener("click", showSimulator)

// Event listener para el botón de acción (puede personalizarse según necesidades)
btnAction.addEventListener("click", () => {
  console.log(`Acción ejecutada para estado: ${currentStatus}`)
  // Aquí puedes agregar la lógica específica para cada acción
  alert(`Acción ejecutada para: ${currentStatus}`)
})

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  console.log("Aplicación de resultado de pago cargada")
})
