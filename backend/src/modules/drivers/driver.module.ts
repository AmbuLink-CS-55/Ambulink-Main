import { Module } from "@nestjs/common";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";
import { DbService } from "@/database/db.service";

@Module({
  controllers: [DriverController],
  providers: [DriverService, DbService],
})
export class DriverModule {}
