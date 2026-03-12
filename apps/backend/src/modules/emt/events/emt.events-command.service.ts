import { Injectable } from "@nestjs/common";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { EmtEventsService } from "./emt.events.service";

@Injectable()
export class EmtEventsCommandService {
  constructor(private emtEventsService: EmtEventsService) {}

  async subscribe(emtId: string, bookingId: string) {
    return this.emtEventsService.subscribeToBooking(emtId, bookingId);
  }

  async addNote(params: {
    emtId: string;
    bookingId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.emtEventsService.addNote(
      params.emtId,
      params.bookingId,
      params.content ?? "",
      params.files ?? [],
      params.durationMs
    );
  }
}
