import { useEffect, useMemo, useState } from "react";

import { fetchNearbyHospitals, type NearbyHospital } from "@/common/lib/hospitals";

type Params = {
  x?: number;
  y?: number;
  limit?: number;
  radiusKm?: number;
};

export function useNearbyHospitals({ x, y, limit = 6, radiusKm = 10 }: Params) {
  const [hospitals, setHospitals] = useState<NearbyHospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(() => Number.isFinite(x) && Number.isFinite(y), [x, y]);

  useEffect(() => {
    if (!canFetch || x === undefined || y === undefined) {
      setHospitals([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNearbyHospitals(x, y, { limit, radiusKm })
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
  }, [canFetch, x, y, limit, radiusKm]);

  return { hospitals, loading, error };
}
