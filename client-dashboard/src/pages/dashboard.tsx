import { Map, MapControls, MapEvents } from "@/components/ui/map";
import { useSocketStore } from "@/hooks/use-socket-store";
import { useStore } from "@/hooks/use-store";
import { useEffect } from "react";


export default function DashBoard() {
  const mapView = useStore((state) => state.mapView)
  const setMapView = useStore((state) => state.setMapView)

  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    // Listen for global ambulance updates
    socket.on("driver:update", (data) => {
      // Update local state or Zustand store
    });

    return () => {
      socket.off("ambulance_moved");
    };
  }, [socket]);

  return (
    <>
      <Map
        theme="light"
        center={mapView.center}
        zoom={mapView.zoom}
      >
        <MapEvents onChange={setMapView} />
        <MapControls
          position="bottom-right"
          showZoom
          showLocate
          className="mb-4"
        />
      </ Map>
    </>
  );
}
