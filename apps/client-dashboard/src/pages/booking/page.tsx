import { useMemo, useState } from "react";
import { DataTable } from "@/components/VirtualizedTable";
import { useGetBookingLog } from "@/services/booking.service";
import { bookingLogColumns } from "@/pages/booking/components/booking-log-columns";
import { BookingDetailDialog } from "@/pages/booking/components/BookingDetailDialog";
import { getDispatcherId } from "@/lib/identity";
import env from "@/../env";

export default function BookingLogPage() {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const bookingLog = useGetBookingLog({ providerId: env.VITE_PROVIDER_ID });

  const rows = useMemo(() => bookingLog.data ?? [], [bookingLog.data]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Booking Log</h1>
          <p className="text-sm text-muted-foreground">Active and completed bookings.</p>
        </div>
      </div>

      <BookingDetailDialog
        open={Boolean(selectedBookingId)}
        bookingId={selectedBookingId}
        dispatcherId={getDispatcherId()}
        onOpenChange={(open) => {
          if (!open) setSelectedBookingId(null);
        }}
      />

      <DataTable
        columns={bookingLogColumns}
        rows={rows}
        height={640}
        rowHeight={56}
        rowKey={(row) => row.bookingId}
        onRowClick={(row) => setSelectedBookingId(row.bookingId)}
      />
    </div>
  );
}
