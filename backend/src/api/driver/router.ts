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

    onMessage(event, ws) {
      // ws.send(JSON.stringify({ rideId: rideId, status: "SEARCHING" }));
      // TODO: type this
      const message = JSON.parse(event.data as string);

      let driver = DriverConnections.get(driverId)

      if (!driver) {
        throw Error(`driver id:${driverId} does not exhist`)
      }

      if (message.type === "LOCATION") {
        driver.location.lat = message.location.lat;
        driver.location.lng = message.location.lng;
      }

      DriverConnections.set(driverId, driver);
    },

    onClose(event, ws) {
      DriverConnections.delete(driverId);
    },
  }
}));
