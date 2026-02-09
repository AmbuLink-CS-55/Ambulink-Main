import type { Hospital } from "@/lib/types";
import { useId, useState, useMemo, useEffect } from "react";
import { useMap, MapPopup } from "../ui/map";

export default function HospitalMarkersLayer({
  hospitals,
}: {
  hospitals: Hospital[];
}) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `hospitals-source-${id}`;
  const layerId = `hospitals-layer-${id}`;
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(
    null,
  );

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

    console.log(hospitals);
    console.log(geoJsonData);


    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": 8,
        "circle-color": "#2B7FFF",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff",
      },
    });

    const handleClick = ( e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[]}) => {
      if (!e.features?.length) return;
      setSelectedHospital(hospitals[e.features[0].properties.arrIdx])
    }
    map.on("mouseover", layerId, handleClick)
  }, [map, isLoaded, geoJsonData]);

  if (hospitals === undefined) return <></>;
  return (
    <>
      {selectedHospital && (
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
      )}
    </>
  );
}

function hospitalsToGeoJSON(hospitals: Hospital[]) {
  return {
    type: "FeatureCollection" as const,
    features: hospitals
//      .filter((h) => h.location && h.isActive)
      .map((h, i) => ({
        type: "Feature" as const,
        properties: {
          arrIdx: i,
          id: h.id,
          name: h.name,
          category: h.hospitalType,
          phone: h.phoneNumber,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [h.location!.x, h.location!.y],
        },
      })),
  };
}
