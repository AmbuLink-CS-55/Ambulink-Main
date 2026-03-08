import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBookingActionErrorMessage } from "@/lib/booking-ui-errors";
import type { BookingDetailsPayload } from "@/lib/socket-types";
import { useAddBookingNote, useGetBookingDetails } from "@/services/booking.service";
import env from "../../../../env";

type Props = {
  bookingId: string | null;
  dispatcherId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function statusVariant(status: string): BadgeVariant {
  if (status === "ASSIGNED") return "assigned";
  if (status === "ARRIVED") return "arrived";
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "critical";
  if (status === "REQUESTED") return "default";
  return "info";
}

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
    if (details?.status === "COMPLETED") {
      setSubmitError("Notes are locked for completed bookings.");
      return;
    }
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
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="gap-1 p-0 pr-12 text-left">
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
            dispatcherId={dispatcherId}
            noteContent={noteContent}
            setNoteContent={setNoteContent}
            submitNote={submitNote}
            submitError={submitError}
            isSubmitting={addNote.isPending}
            notes={notes}
            isNotesLocked={details.status === "COMPLETED"}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Booking details unavailable.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BookingContent({
  details,
  dispatcherId,
  notes,
  noteContent,
  setNoteContent,
  submitNote,
  submitError,
  isSubmitting,
  isNotesLocked,
  onClose,
}: {
  details: BookingDetailsPayload;
  dispatcherId: string;
  notes: BookingDetailsPayload["notes"];
  noteContent: string;
  setNoteContent: (value: string) => void;
  submitNote: () => Promise<void>;
  submitError: string | null;
  isSubmitting: boolean;
  isNotesLocked: boolean;
  onClose: () => void;
}) {
  const [previewAttachment, setPreviewAttachment] = useState<{
    filename: string;
    mimeType: string;
    kind: string;
    sizeBytes: number;
    url: string;
  } | null>(null);

  const apiOrigin = env.VITE_API_SERVER_URL.replace(/\/api\/?$/, "");
  const toAttachmentUrl = (rawUrl: string) => {
    const absolute = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
    const url = absolute ? rawUrl : `${apiOrigin}${rawUrl}`;
    return `${url}?dispatcherId=${dispatcherId}`;
  };

  const previewUrl = previewAttachment ? toAttachmentUrl(previewAttachment.url) : null;
  const displayName = previewAttachment ? formatAttachmentName(previewAttachment.filename) : null;

  return (
    <>
      <div className="space-y-6 text-sm">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Summary</h3>
          <div className="space-y-3 rounded-md border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">Booking ID:</span>
              <span>{details.bookingId}</span>
              <Badge variant={statusVariant(details.status)}>{details.status}</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2 text-muted-foreground sm:grid-cols-2">
              <div>
                Requested:{" "}
                {details.requestedAt ? new Date(details.requestedAt).toLocaleString() : "-"}
              </div>
              <div>
                Assigned: {details.assignedAt ? new Date(details.assignedAt).toLocaleString() : "-"}
              </div>
              <div>
                Arrived: {details.arrivedAt ? new Date(details.arrivedAt).toLocaleString() : "-"}
              </div>
              <div>
                Picked up:{" "}
                {details.pickedupAt ? new Date(details.pickedupAt).toLocaleString() : "-"}
              </div>
              <div>
                Completed:{" "}
                {details.completedAt ? new Date(details.completedAt).toLocaleString() : "-"}
              </div>
              <div>Cancelled reason: {details.cancellationReason ?? "-"}</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <EntityCard
            title="Patient"
            id={details.patient.id}
            name={details.patient.fullName}
            phone={details.patient.phoneNumber}
          />
          <EntityCard
            title="Driver"
            id={details.driver.id}
            name={details.driver.fullName}
            phone={details.driver.phoneNumber}
          />
          <EntityCard
            title="Hospital"
            id={details.hospital.id}
            name={details.hospital.name}
            phone={details.hospital.phoneNumber}
          />
          <EntityCard
            title="Provider"
            id={details.provider.id}
            name={details.provider.name}
            phone={null}
          />
        </section>

        <section className="space-y-3 rounded-md border p-4">
          <h3 className="text-sm font-semibold">Shared Notes (EMT + Dispatcher)</h3>
          <div className="max-h-60 space-y-3 overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="space-y-2 rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      className={
                        note.authorRole === "EMT"
                          ? "bg-slate-300 text-slate-900 hover:bg-slate-300"
                          : note.authorRole === "PATIENT"
                            ? "bg-emerald-600 text-white hover:bg-emerald-600"
                            : "bg-blue-600 text-white hover:bg-blue-600"
                      }
                    >
                      {note.authorRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm leading-6">{note.content}</p>
                  {(note.attachments ?? []).length > 0 ? (
                    <div className="space-y-2">
                      {note.attachments?.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="space-y-2 rounded-md border p-2 text-xs"
                        >
                          <div className="text-slate-700">
                            {attachment.kind} - {formatAttachmentName(attachment.filename)} (
                            {Math.ceil(attachment.sizeBytes / 1024)} KB)
                          </div>
                          {attachment.mimeType.startsWith("image/") ? (
                            <button
                              type="button"
                              className="block w-full overflow-hidden rounded-md border"
                              onClick={() =>
                                setPreviewAttachment({
                                  filename: attachment.filename,
                                  mimeType: attachment.mimeType,
                                  kind: attachment.kind,
                                  sizeBytes: attachment.sizeBytes,
                                  url: attachment.url,
                                })
                              }
                            >
                              <img
                                src={toAttachmentUrl(attachment.url)}
                                alt={attachment.filename}
                                className="h-36 w-full object-cover"
                              />
                            </button>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                setPreviewAttachment({
                                  filename: attachment.filename,
                                  mimeType: attachment.mimeType,
                                  kind: attachment.kind,
                                  sizeBytes: attachment.sizeBytes,
                                  url: attachment.url,
                                })
                              }
                            >
                              Preview
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <textarea
              className="min-h-20 max-h-[120px] w-full resize-none rounded-md border bg-background p-3 text-sm"
              placeholder={
                isNotesLocked
                  ? "Notes are disabled for completed bookings."
                  : "Add dispatcher note..."
              }
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              disabled={isNotesLocked}
            />
            {isNotesLocked ? (
              <p className="text-sm text-muted-foreground">
                This booking is completed. Dispatchers can view notes but cannot add new ones.
              </p>
            ) : null}
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button onClick={submitNote} disabled={isSubmitting || isNotesLocked}>
                {isSubmitting ? "Saving..." : "Add Note"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Dialog
        open={Boolean(previewAttachment)}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
      >
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-6xl overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>Attachment Preview</DialogTitle>
            <DialogDescription>
              <span className="inline-block max-w-full truncate align-bottom">
                {displayName} {previewAttachment ? `(${previewAttachment.kind})` : ""}
              </span>
            </DialogDescription>
          </DialogHeader>

          {previewAttachment && previewUrl ? (
            <div className="space-y-3 px-6 py-4">
              {previewAttachment.mimeType.startsWith("image/") ? (
                <div className="flex min-h-[56vh] items-center justify-center rounded-md border bg-black/90 p-2">
                  <img
                    src={previewUrl}
                    alt={previewAttachment.filename}
                    className="max-h-[75vh] max-w-full object-contain"
                  />
                </div>
              ) : previewAttachment.mimeType.startsWith("video/") ? (
                <video
                  src={previewUrl}
                  controls
                  className="max-h-[70vh] w-full rounded-md border bg-black"
                />
              ) : previewAttachment.mimeType.startsWith("audio/") ? (
                <audio src={previewUrl} controls className="w-full" />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Inline preview is not available for this file type.
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
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
    <div className="space-y-2 rounded-md border p-4 text-sm">
      <h4 className="font-semibold">{title}</h4>
      <div className="text-muted-foreground">ID: {id ?? "-"}</div>
      <div>Name: {name ?? "-"}</div>
      {phone !== null ? <div>Phone: {phone ?? "-"}</div> : null}
    </div>
  );
}

function formatAttachmentName(filename: string) {
  const cleaned = filename.replace(/^[0-9a-f]{8}-[0-9a-f-]{27,}[_-]/i, "");
  return cleaned.length > 60 ? `${cleaned.slice(0, 57)}...` : cleaned;
}
