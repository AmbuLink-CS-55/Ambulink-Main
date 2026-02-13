import { Module } from "@nestjs/common";
import { DispatcherService } from "./dispatcher.service";
import { DispatcherGateway } from "./dispatcher.gateway";

@Module({
  controllers: [],
  providers: [DispatcherService, DispatcherGateway],
  imports: [],
  exports: [DispatcherService, DispatcherGateway],
})
export class DispatcherModule {}
