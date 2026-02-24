import { useEffect, useMemo, useState } from "react";

import { fetchNearbyHospitals, type NearbyHospital } from "@/lib/hospitals";

type Params = {
  latitude?: number;
  longitude?: number;
  limit?: number;
  radiusKm?: number;
};

export function useNearbyHospitals({ latitude, longitude, limit = 6, radiusKm = 10 }: Params) {
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(
    () => Number.isFinite(latitude) && Number.isFinite(longitude),
    [latitude, longitude]
  );

  useEffect(() => {
    if (!canFetch || latitude === undefined || longitude === undefined) {
      setHospitals([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNearbyHospitals(latitude, longitude, { limit, radiusKm })
      .then((data) => {
        if (!cancelled) {
          setHospitals(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setHospitals([]);
          setError(err instanceof Error ? err.message : "Failed to fetch nearby hospitals");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canFetch, latitude, longitude, limit, radiusKm]);

  return { hospitals, loading, error };
}
