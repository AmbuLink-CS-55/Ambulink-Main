import { Controller, Get } from "@nestjs/common";
import { HospitalService } from "./hospital.service";

@Controller("api/hospital")
export class DriverController {
  constructor(private readonly hospitalService: HospitalService) {}

  @Get("/")
  getAll() {
    return this.hospitalService.getAll();
  }
}
