import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Map as MapView, MapClusterLayer, MapControls, MapPopup } from "@/components/ui/map";
import type { AnalyticsZones } from "@ambulink/types";
import type { ZoneClusterProperties } from "@/pages/analytics/analytics-utils";

export function AnalyticsZonesTab({
  mapTheme,
  zoneLayer,
  setZoneLayer,
  data,
}: {
  mapTheme: "light" | "dark";
  zoneLayer: "origins" | "destinations";
  setZoneLayer: (layer: "origins" | "destinations") => void;
  data?: AnalyticsZones;
}) {
  const [selectedZonePoint, setSelectedZonePoint] = useState<{
    coordinates: [number, number];
    properties: ZoneClusterProperties;
  } | null>(null);
  const [selectedZoneCluster, setSelectedZoneCluster] = useState<{
    coordinates: [number, number];
    pointCount: number;
  } | null>(null);

  const zoneCells = useMemo(
    () =>
      zoneLayer === "origins"
        ? data?.responseOrigins ?? []
        : data?.hospitalDestinations ?? [],
    [zoneLayer, data?.responseOrigins, data?.hospitalDestinations]
  );

  const zoneClusterPoints = useMemo(
    () =>
      ({
        type: "FeatureCollection",
        features: zoneCells.flatMap((cell) => {
          // Expand each grid cell into weighted points so cluster strength reflects demand volume.
          const repeats = Math.min(30, Math.max(1, Math.round(cell.count)));
          return Array.from({ length: repeats }, () => ({
            type: "Feature",
            properties: {
              key: cell.key,
              count: cell.count,
            },
            geometry: {
              type: "Point",
              coordinates: [cell.center.x, cell.center.y],
            },
          }));
        }),
      }) as GeoJSON.FeatureCollection<
        GeoJSON.Point,
        ZoneClusterProperties
      >,
    [zoneCells]
  );

  const zoneCenter = useMemo<[number, number]>(() => {
    if (zoneCells.length === 0) return [79.87, 6.9];
    const sum = zoneCells.reduce(
      (acc, cell) => {
        acc.x += cell.center.x;
        acc.y += cell.center.y;
        return acc;
      },
      { x: 0, y: 0 }
    );
    return [sum.x / zoneCells.length, sum.y / zoneCells.length];
  }, [zoneCells]);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={zoneLayer === "origins" ? "primary" : "outline"}
            onClick={() => {
              setZoneLayer("origins");
              setSelectedZonePoint(null);
              setSelectedZoneCluster(null);
            }}
          >
            Response Origins
          </Button>
          <Button
            variant={zoneLayer === "destinations" ? "primary" : "outline"}
            onClick={() => {
              setZoneLayer("destinations");
              setSelectedZonePoint(null);
              setSelectedZoneCluster(null);
            }}
          >
            Hospital Destinations
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">{zoneCells.length} grid cells in selected range</span>
        </div>
      </div>

      <div className="h-[70vh] overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--card)]">
        {zoneCells.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No zone data in this range.
          </div>
        ) : (
          <MapView theme={mapTheme} center={zoneCenter} zoom={10.5}>
            <MapControls position="bottom-right" showZoom showLocate className="mb-4" />
            <MapClusterLayer
              data={zoneClusterPoints}
              clusterRadius={50}
              clusterMaxZoom={13}
              clusterColors={["#1d8cf8", "#6d5dfc", "#e23670"]}
              clusterThresholds={[8, 30]}
              pointColor="#1d8cf8"
              onPointClick={(feature, coordinates) => {
                setSelectedZoneCluster(null);
                setSelectedZonePoint({
                  coordinates,
                  properties: feature.properties,
                });
              }}
              onClusterClick={(_clusterId, coordinates, pointCount) => {
                setSelectedZonePoint(null);
                setSelectedZoneCluster({ coordinates, pointCount });
              }}
            />
            {selectedZoneCluster ? (
              <MapPopup
                key={`${selectedZoneCluster.coordinates[0]}-${selectedZoneCluster.coordinates[1]}-cluster`}
                longitude={selectedZoneCluster.coordinates[0]}
                latitude={selectedZoneCluster.coordinates[1]}
                onClose={() => setSelectedZoneCluster(null)}
                closeOnClick={false}
                focusAfterOpen={false}
                closeButton
              >
                <div className="space-y-1 p-1 text-xs">
                  <div className="font-semibold text-foreground">Cluster summary</div>
                  <div className="text-muted-foreground">Points in cluster: {selectedZoneCluster.pointCount}</div>
                </div>
              </MapPopup>
            ) : null}
            {selectedZonePoint ? (
              <MapPopup
                key={`${selectedZonePoint.coordinates[0]}-${selectedZonePoint.coordinates[1]}`}
                longitude={selectedZonePoint.coordinates[0]}
                latitude={selectedZonePoint.coordinates[1]}
                onClose={() => setSelectedZonePoint(null)}
                closeOnClick={false}
                focusAfterOpen={false}
                closeButton
              >
                <div className="space-y-1 p-1 text-xs">
                  <div className="font-semibold text-foreground">
                    {zoneLayer === "origins" ? "Response origin cell" : "Hospital destination cell"}
                  </div>
                  <div className="text-muted-foreground">Requests in cell: {selectedZonePoint.properties.count}</div>
                </div>
              </MapPopup>
            ) : null}
          </MapView>
        )}
      </div>
    </div>
  );
}
