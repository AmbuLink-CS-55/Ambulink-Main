import { Injectable } from "@nestjs/common";
import { EmtService } from "./emt.service";
import type { UploadedMediaFile } from "../booking/booking-media.service";

@Injectable()
export class EmtCommandService {
  constructor(private emtService: EmtService) {}

  async subscribe(emtId: string, bookingId: string) {
    return this.emtService.subscribeToBooking(emtId, bookingId);
  }

  async addNote(params: {
    emtId: string;
    bookingId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.emtService.addNote(
      params.emtId,
      params.bookingId,
      params.content ?? "",
      params.files ?? [],
      params.durationMs
    );
  }
}
