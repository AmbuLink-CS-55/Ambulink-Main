import { Hono } from "hono";
import { upgradeWebSocket } from 'hono/bun';
import type { WSContext } from "hono/ws";
import { DriverConnections } from "../driver/router";

export const rideRoutes = new Hono();

const clientConnections = new Map<string, Ride>();
const rideWebSockets = new Map<string, WSContext>();

rideRoutes.get('/ride/ws', upgradeWebSocket((c) => {

  console.log("reached route")

  let patientId = c.req.query("id");
  if (!patientId) patientId = crypto.randomUUID();

  const lat = parseFloat(c.req.query("lat") || "0");
  const lng = parseFloat(c.req.query("lng") || "0");


  const rideId = crypto.randomUUID();


  return {
    onOpen(event, ws) {
      console.log(`${rideId} upgraded to websocket`)

      if (!lat || !lng) {
        throw Error("missing lat/lng")
      }
      const ride: Ride = {
        id: rideId,
        patientId: patientId,
        driverId: null,
        pickup: { lat, lng },
        status: "SEARCHING",
        assignedDriverId: null,
        offerIds: null,
        createdAt: Date.now(),
      };

      clientConnections.set(rideId, ride);
      rideWebSockets.set(rideId, ws);

      searchDrivers(rideId);

      ws.send(JSON.stringify({ rideId: rideId, status: "SEARCHING" }));
    },

    onMessage(event, ws) {
      const message = JSON.parse(event.data as string);

    },

    onClose(event, ws) {
      clientConnections.delete(rideId);
      rideWebSockets.delete(rideId); // Clean up WebSocket
    },
  }

}))

function searchDrivers(rideId: string) {
  const ride = clientConnections.get(rideId);
  if (!ride) {
    throw Error(`ride id ${rideId} does not exhist`);
  }

  let found = false

  // get nearby drivers
  const drivers = getNearbyDrivers(ride);

  // send dispatcher request
  const driver = sendOffer(drivers, ride);


  ride.driverId = driver.id;
  ride.status = "DRIVER_ASSIGNED";
  clientConnections.set(rideId, ride);

}

function getNearbyDrivers(ride: Ride, limit: number = 10): Driver[] {

  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const driversWithDistance = Array.from(DriverConnections.values())
    .filter((driver) => driver.status === "FREE")
    .map((driver) => ({
      driver,
      distance: calculateDistance(
        ride.pickup.lat,
        ride.pickup.lng,
        driver.location.lat,
        driver.location.lng
      ),
    }));

  return driversWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map(({ driver }) => driver);
}

function sendOffer(found: Driver[], ride: Ride): Driver | any {
}
