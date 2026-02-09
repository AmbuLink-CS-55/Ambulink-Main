import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, X, Check, XCircle, Truck } from "lucide-react";
import { useSocketStore } from "@/hooks/use-socket-store";
import { cn } from "@/lib/utils";

export function BookingRequestOverlay() {
  const bookingRequests = useSocketStore((state) => state.bookingRequests);
  const removeBookingRequest = useSocketStore(
    (state) => state.removeBookingRequest,
  );
  const [isOpen, setIsOpen] = useState(true);

  const handleAccept = (
    requestId: string,
    callback: (response: { approved: boolean }) => void,
  ) => {
    callback({ approved: true });
    removeBookingRequest(requestId);
  };

  const handleReject = (
    requestId: string,
    callback: (response: { approved: boolean }) => void,
  ) => {
    callback({ approved: false });
    removeBookingRequest(requestId);
  };

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed top-2 right-4 z-50">
        <Button
          variant="default"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative shadow-lg"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Truck />}
          {bookingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-semibold">
              {bookingRequests.length}
            </span>
          )}
        </Button>
      </div>

      {/* Overlay Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-96 bg-background border-l shadow-2xl z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="items-center w-full justify-between p-2 border-b">
            <h1 className="font-bold text-xl items-center text-center ">
              Activity
            </h1>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {bookingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bell className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {bookingRequests.map((request) => (
                  <Alert
                    key={request.requestId}
                    variant="default"
                    className="animate-in slide-in-from-right-5 border-primary/20"
                  >
                    <Bell className="h-4 w-4" />
                    <AlertTitle>New Booking Request</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Request ID: {request.requestId}
                      </div>
                      {request.data && (
                        <div className="text-xs">
                          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-20">
                            {JSON.stringify(request.data, null, 2)}
                          </pre>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleAccept(request.requestId, request.callback)
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleReject(request.requestId, request.callback)
                          }
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && bookingRequests.length > 0 && (
        <div
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
