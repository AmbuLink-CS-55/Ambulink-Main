import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from "@nestjs/common";
import { AmbulanceService } from "./ambulance.service";
import { CreateAmbulanceDto } from "./dto/create-ambulance.dto";
import { UpdateAmbulanceDto } from "./dto/update-ambulance.dto";

@Controller("ambulances")
export class AmbulanceController {
  constructor(private readonly ambulanceService: AmbulanceService) {}

  @Post()
  create(@Body() createAmbulanceDto: CreateAmbulanceDto) {
    return this.ambulanceService.create(createAmbulanceDto);
  }

  @Get()
  findAll() {
    return this.ambulanceService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ambulanceService.findOne(+id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateAmbulanceDto: UpdateAmbulanceDto
  ) {
    return this.ambulanceService.update(+id, updateAmbulanceDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ambulanceService.remove(+id);
  }
}
