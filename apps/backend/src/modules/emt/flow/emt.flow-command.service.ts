import { Injectable } from "@nestjs/common";
import type { UploadedMediaFile } from "@/modules/booking/booking-media.service";
import { EmtFlowService } from "./emt.flow.service";

@Injectable()
export class EmtFlowCommandService {
  constructor(private emtFlowService: EmtFlowService) {}

  async subscribe(emtId: string, bookingId: string) {
    return this.emtFlowService.subscribeToBooking(emtId, bookingId);
  }

  async addNote(params: {
    emtId: string;
    bookingId: string;
    content?: string;
    files: UploadedMediaFile[];
    durationMs?: number;
  }) {
    return this.emtFlowService.addNote(
      params.emtId,
      params.bookingId,
      params.content ?? "",
      params.files ?? [],
      params.durationMs
    );
  }
}
