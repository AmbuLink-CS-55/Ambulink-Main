import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getDispatcherId } from "@/lib/identity";
import { getAnalyticsReportDownloadUrl } from "@/services/analytics.service";
import { useGetBookingLog } from "@/services/booking.service";
import env from "@/../env";

export default function AnalyticsReportsPage() {
  const dispatcherId = getDispatcherId();
  const bookingLog = useGetBookingLog({ providerId: env.VITE_PROVIDER_ID });
  const [downloadingBookingId, setDownloadingBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDownload = async (bookingId: string) => {
    setDownloadingBookingId(bookingId);
    setError(null);
    try {
      const url = getAnalyticsReportDownloadUrl({
        dispatcherId,
        bookingId,
      });
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Report generation failed.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `booking-${bookingId.slice(0, 8)}-report.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate report.");
    } finally {
      setDownloadingBookingId(null);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics Reports</h1>
        <p className="text-sm text-muted-foreground">Generate per-booking PDF reports.</p>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        {bookingLog.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading completed bookings...</p>
        ) : bookingLog.error ? (
          <p className="text-sm text-destructive">Failed to load booking history.</p>
        ) : (bookingLog.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-left">
                  <th className="py-2 pr-4">Booking ID</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(bookingLog.data ?? []).map((booking) => (
                  <tr key={booking.bookingId} className="border-b border-[color:var(--border)]/60">
                    <td className="py-2 pr-4 font-mono text-xs">{booking.bookingId}</td>
                    <td className="py-2 pr-4">
                      {booking.completedAt
                        ? new Date(booking.completedAt).toLocaleString()
                        : booking.requestedAt
                          ? new Date(booking.requestedAt).toLocaleString()
                          : "-"}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm"
                        onClick={() => void onDownload(booking.bookingId)}
                        disabled={downloadingBookingId === booking.bookingId}
                      >
                        {downloadingBookingId === booking.bookingId ? "Generating..." : "Report"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {error ? (
          <div className="mt-3">
            <span className="text-sm text-destructive">{error}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
