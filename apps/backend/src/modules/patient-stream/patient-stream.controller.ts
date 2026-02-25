import { BadRequestException, Controller, MessageEvent, Query, Req, Sse } from "@nestjs/common";
import { Observable } from "rxjs";
import type { Request } from "express";
import { PatientStreamService } from "./patient-stream.service";

@Controller("api/patient-stream")
export class PatientStreamController {
  constructor(private patientStreamService: PatientStreamService) {}

  @Sse()
  stream(@Query("patientId") patientId?: string, @Req() req?: Request): Observable<MessageEvent> {
    if (!patientId) {
      throw new BadRequestException("patientId is required");
    }

    const { stream$, close } = this.patientStreamService.createConnection(patientId);

    req?.on("close", close);
    req?.on("end", close);

    return stream$;
  }
}
