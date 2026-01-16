import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { EmtController } from "./emt.controller";
import { EmtService } from "./emt.service";

@Module({
  imports: [DbModule],
  controllers: [EmtController],
  providers: [EmtService],
})
export class EmtModule {}
