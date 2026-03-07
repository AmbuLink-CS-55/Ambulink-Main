import { Injectable } from "@nestjs/common";
import { EmtService } from "./emt.service";

@Injectable()
export class EmtCommandService {
  constructor(private emtService: EmtService) {}

  async subscribe(emtId: string, bookingId: string) {
    return this.emtService.subscribeToBooking(emtId, bookingId);
  }

  async addNote(emtId: string, bookingId: string, content: string) {
    return this.emtService.addNote(emtId, bookingId, content);
  }
}
