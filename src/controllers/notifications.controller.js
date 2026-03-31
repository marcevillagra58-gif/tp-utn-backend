/**
 * ============================================================================
 * CONTROLLERS/NOTIFICATIONS.CONTROLLER.JS — Server-Sent Events (SSE)
 * ============================================================================
 *
 * Gestiona una conexión persistente para enviar notificaciones en tiempo real
 * sin WebSockets. Útil para navegadores antiguos o entornos con firewalls.
 * ============================================================================
 */

let clients = [];

// ============================================================
// GET /api/notifications/stream
// ============================================================
export const streamNotifications = (req, res) => {
  // Configurar headers para SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res,
  };

  clients.push(newClient);

  // Enviar mensaje de bienvenida inicial
  res.write(
    `data: ${JSON.stringify({ type: "connected", message: "SSE Activado" })}\n\n`,
  );

  // Limpiar al desconectar
  req.on("close", () => {
    console.log(`🔌 Cliente SSE desconectado: ${clientId}`);
    clients = clients.filter((c) => c.id !== clientId);
  });
};

// ============================================================
// Utilidad para enviar notificaciones a todos los clientes
// ============================================================
export const sendSSENotification = (data) => {
  clients.forEach((client) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
};
