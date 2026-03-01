import type { Hospital } from "@/lib/types";
import { memo, useId, useState, useMemo, useEffect } from "react";
import { useMap, MapPopup } from "@/components/ui/map";

function resolveThemeColor(variableName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return resolved || fallback;
}

function HospitalMarkersLayer({ hospitals }: { hospitals: Hospital[] }) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `hospitals-source-${id}`;
  const layerId = `hospitals-layer-${id}`;
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  const geoJsonData = useMemo(() => hospitalsToGeoJSON(hospitals), [hospitals]);

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: geoJsonData,
      });
    } else {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geoJsonData);
    }

    const triangleId = "hospital-triangle-marker";
    const triangleFill = resolveThemeColor("--amb-info", "#2B7FFF");
    const triangleStroke = resolveThemeColor("--amb-surface", "#ffffff");
    const ensureLayer = () => {
      const existingLayer = map.getLayer(layerId);
      if (existingLayer && existingLayer.type !== "symbol") {
        map.removeLayer(layerId);
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: "symbol",
          source: sourceId,
          layout: {
            "icon-image": triangleId,
            "icon-size": 0.9,
            "icon-allow-overlap": true,
          },
        });
      }
    };

    if (!map.hasImage(triangleId)) {
      const triangleSvg =
        "<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24'>" +
        `<path d='M12 3 L22 21 L2 21 Z' fill='${triangleFill}' stroke='${triangleStroke}' stroke-width='2'/>` +
        "</svg>";
      const image = new Image(26, 26);
      image.onload = () => {
        if (!map.hasImage(triangleId)) {
          map.addImage(triangleId, image);
        }
        ensureLayer();
      };
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(triangleSvg)}`;
    } else {
      ensureLayer();
    }

    const handleClick = (
      e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
    ) => {
      if (!e.features?.length) return;
      setSelectedHospital(hospitals[e.features[0].properties.arrIdx]);
    };
    const handleMouseOut = () => {
      setSelectedHospital(null);
    };
    const attachEvents = () => {
      if (!map.getLayer(layerId)) return;
      map.on("mouseover", layerId, handleClick);
      map.on("mouseout", layerId, handleMouseOut);
    };

    attachEvents();

    return () => {
      map.off("mouseover", layerId, handleClick);
      map.off("mouseout", layerId, handleMouseOut);
    };
  }, [map, isLoaded, geoJsonData, sourceId, layerId, hospitals]);

  if (hospitals === undefined) return <></>;
  return (
    <>
      {selectedHospital ? (
        <MapPopup
          longitude={selectedHospital.location!.x}
          latitude={selectedHospital.location!.y}
          onClose={() => setSelectedHospital(null)}
        >
          <div className="p-2">
            <h3 className="font-bold text-l">{selectedHospital.name}</h3>
            <p className="text-xs">{selectedHospital.hospitalType}</p>
          </div>
        </MapPopup>
      ) : null}
    </>
  );
}

function hospitalsToGeoJSON(hospitals: Hospital[]) {
  return {
    type: "FeatureCollection" as const,
    features: hospitals.map((hospital, index) => ({
      type: "Feature" as const,
      properties: {
        arrIdx: index,
        id: hospital.id,
        name: hospital.name,
        category: hospital.hospitalType,
        phone: hospital.phoneNumber,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [hospital.location!.x, hospital.location!.y],
      },
    })),
  };
}

export default memo(HospitalMarkersLayer);
