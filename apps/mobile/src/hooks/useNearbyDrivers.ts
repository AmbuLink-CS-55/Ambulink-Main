import { useEffect, useMemo, useState } from "react";

import { fetchNearbyDrivers, type NearbyDriver } from "@/lib/drivers";

type Params = {
  latitude?: number;
  longitude?: number;
  limit?: number;
};

export function useNearbyDrivers({ latitude, longitude, limit = 6 }: Params) {
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(
    () => Number.isFinite(latitude) && Number.isFinite(longitude),
    [latitude, longitude]
  );

  useEffect(() => {
    if (!canFetch || latitude === undefined || longitude === undefined) {
      setDrivers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNearbyDrivers(latitude, longitude, { limit })
      .then((data) => {
        if (!cancelled) {
          setDrivers(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDrivers([]);
          setError(err instanceof Error ? err.message : "Failed to fetch nearby drivers");
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
  }, [canFetch, latitude, longitude, limit]);

  return { drivers, loading, error };
}
