import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";

export const driverRoutes = new Hono();

export const DriverConnections = new Map<string, Driver>();

driverRoutes.get("/driver/ws", upgradeWebSocket((c) => {

  const driverId = c.req.param("id");
  if (!driverId) {
    throw Error("missing driver id");
  }

  const lat = parseFloat(c.req.query("lat") || "0");
  const lng = parseFloat(c.req.query("lng") || "0");

  if (!lat || !lng) {
    throw Error("missing lat/lng")
  }

  return {
    onOpen(event, ws) {

      const prevDriver = DriverConnections.get(driverId);

      DriverConnections.set(driverId, {
        id: driverId,
        status: prevDriver?.status ?? "FREE",
        location: { lat: lat, lng: lng },
      })

      ws.send("Connected")
    },

    onClose(evt, ws) {
      DriverConnections.delete(driverId);
    },
  }
}));
