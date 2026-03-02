import { useEffect, useMemo, useState } from "react";

import { fetchNearbyDrivers, type NearbyDriver } from "@/common/lib/drivers";

type Params = {
  x?: number;
  y?: number;
  limit?: number;
};

export function useNearbyDrivers({ x, y, limit = 6 }: Params) {
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canFetch = useMemo(() => Number.isFinite(x) && Number.isFinite(y), [x, y]);

  useEffect(() => {
    if (!canFetch || x === undefined || y === undefined) {
      setDrivers([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchNearbyDrivers(x, y, { limit })
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
  }, [canFetch, x, y, limit]);

  return { drivers, loading, error };
}
