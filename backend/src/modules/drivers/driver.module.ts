import { Module } from "@nestjs/common";
import { DbModule } from "@/database/db.module";
import { DriverController } from "./driver.controller";
import { DriverService } from "./driver.service";

@Module({
  imports: [DbModule],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
