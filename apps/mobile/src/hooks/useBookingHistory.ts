import { useCallback, useEffect, useState } from "react";
import {
  clearBookingHistory,
  loadBookingHistory,
  subscribeBookingHistory,
  type BookingHistoryEntry,
  type BookingHistoryRole,
} from "@/utils/bookingHistory";

export function useBookingHistory(role: BookingHistoryRole) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BookingHistoryEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const history = await loadBookingHistory(role);
    setItems(history);
    setLoading(false);
  }, [role]);

  const clear = useCallback(async () => {
    await clearBookingHistory(role);
  }, [role]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeBookingHistory(role, (next) => {
      setItems(next);
      setLoading(false);
    });
    return unsubscribe;
  }, [load, role]);

  return { loading, items, reload: load, clear };
}
