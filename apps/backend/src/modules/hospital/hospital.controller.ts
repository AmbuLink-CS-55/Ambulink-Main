import { Controller, Get } from "@nestjs/common";
import { HospitalService } from "./hospital.service";

@Controller("api/hospitals")
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get("/")
  getAll() {
    return this.hospitalService.getAll();
  }
}
