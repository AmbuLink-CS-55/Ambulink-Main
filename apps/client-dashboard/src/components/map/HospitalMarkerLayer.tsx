import type { Hospital } from "@/lib/types";
import { memo, useId, useState, useMemo, useEffect } from "react";
import { useMap, MapPopup } from "../ui/map";

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

    const handleClick = (
      e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }
    ) => {
      if (!e.features?.length) return;
      setSelectedHospital(hospitals[e.features[0].properties.arrIdx]);
    };
    map.on("mouseover", layerId, handleClick);
    map.on("mouseout", layerId, () => {
      setSelectedHospital(null);
    });
  }, [map, isLoaded, geoJsonData, sourceId, layerId, hospitals]);

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
