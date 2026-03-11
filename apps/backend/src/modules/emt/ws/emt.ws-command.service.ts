import { Injectable } from "@nestjs/common";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { EmtWsService } from "./emt.ws.service";

@Injectable()
export class EmtWsCommandService {
  constructor(private emtWsService: EmtWsService) {}

  async subscribe(emtId: string, bookingId: string) {
    return this.emtWsService.subscribeToBooking(emtId, bookingId);
  }

  async addNote(params: {
    emtId: string;
    bookingId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.emtWsService.addNote(
      params.emtId,
      params.bookingId,
      params.content ?? "",
      params.files ?? [],
      params.durationMs
    );
  }
}
