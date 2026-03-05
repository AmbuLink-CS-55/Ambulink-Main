import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBookingActionErrorMessage } from "@/lib/booking-ui-errors";
import type { BookingDetailsPayload } from "@/lib/socket-types";
import { useAddBookingNote, useGetBookingDetails } from "@/services/booking.service";

type Props = {
  bookingId: string | null;
  dispatcherId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingDetailDialog({ bookingId, dispatcherId, open, onOpenChange }: Props) {
  const [noteContent, setNoteContent] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const detailsQuery = useGetBookingDetails(open ? bookingId : null, dispatcherId);
  const addNote = useAddBookingNote();

  const details = detailsQuery.data;
  const notes = useMemo(
    () => (details?.notes ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [details?.notes]
  );

  const submitNote = async () => {
    if (!bookingId) return;
    if (!noteContent.trim()) {
      setSubmitError("Type a note before submitting.");
      return;
    }

    setSubmitError(null);
    try {
      await addNote.mutateAsync({
        bookingId,
        dispatcherId,
        content: noteContent.trim(),
      });
      setNoteContent("");
    } catch (error) {
      setSubmitError(getBookingActionErrorMessage(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>
            Dispatcher view for booking details and shared EMT/dispatcher notes.
          </DialogDescription>
        </DialogHeader>

        {!bookingId ? (
          <p className="text-sm text-muted-foreground">No booking selected.</p>
        ) : detailsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading booking details...</p>
        ) : detailsQuery.error ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load booking details</AlertTitle>
            <AlertDescription>{getBookingActionErrorMessage(detailsQuery.error)}</AlertDescription>
          </Alert>
        ) : details ? (
          <BookingContent
            details={details}
            noteContent={noteContent}
            setNoteContent={setNoteContent}
            submitNote={submitNote}
            submitError={submitError}
            isSubmitting={addNote.isPending}
            notes={notes}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Booking details unavailable.</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingContent({
  details,
  notes,
  noteContent,
  setNoteContent,
  submitNote,
  submitError,
  isSubmitting,
}: {
  details: BookingDetailsPayload;
  notes: BookingDetailsPayload["notes"];
  noteContent: string;
  setNoteContent: (value: string) => void;
  submitNote: () => Promise<void>;
  submitError: string | null;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Summary</h3>
        <div className="rounded-md border p-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Booking ID:</span>
            <span>{details.bookingId}</span>
            <Badge variant={details.status === "CANCELLED" ? "critical" : "info"}>{details.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
            <div>Requested: {details.requestedAt ? new Date(details.requestedAt).toLocaleString() : "-"}</div>
            <div>Assigned: {details.assignedAt ? new Date(details.assignedAt).toLocaleString() : "-"}</div>
            <div>Arrived: {details.arrivedAt ? new Date(details.arrivedAt).toLocaleString() : "-"}</div>
            <div>Picked up: {details.pickedupAt ? new Date(details.pickedupAt).toLocaleString() : "-"}</div>
            <div>Completed: {details.completedAt ? new Date(details.completedAt).toLocaleString() : "-"}</div>
            <div>Cancelled reason: {details.cancellationReason ?? "-"}</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EntityCard title="Patient" id={details.patient.id} name={details.patient.fullName} phone={details.patient.phoneNumber} />
        <EntityCard title="Driver" id={details.driver.id} name={details.driver.fullName} phone={details.driver.phoneNumber} />
        <EntityCard title="Hospital" id={details.hospital.id} name={details.hospital.name} phone={details.hospital.phoneNumber} />
        <EntityCard title="Provider" id={details.provider.id} name={details.provider.name} phone={null} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Shared Notes (EMT + Dispatcher)</h3>
        <div className="rounded-md border p-3 space-y-3 max-h-56 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            notes.map((note) => (
              <div key={note.id} className="rounded-md border p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant={note.authorRole === "EMT" ? "warning" : "info"}>
                    {note.authorRole === "EMT" ? "EMT" : "Dispatcher"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <textarea
            className="w-full min-h-24 rounded-md border bg-background p-2 text-sm"
            placeholder="Add dispatcher note..."
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
          />
          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          <Button onClick={submitNote} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add Note"}
          </Button>
        </div>
      </section>
    </div>
  );
}

function EntityCard({
  title,
  id,
  name,
  phone,
}: {
  title: string;
  id: string | null;
  name: string | null;
  phone: string | null;
}) {
  return (
    <div className="rounded-md border p-3 space-y-1 text-sm">
      <h4 className="font-semibold">{title}</h4>
      <div className="text-muted-foreground">ID: {id ?? "-"}</div>
      <div>Name: {name ?? "-"}</div>
      {phone !== null ? <div>Phone: {phone ?? "-"}</div> : null}
    </div>
  );
}
