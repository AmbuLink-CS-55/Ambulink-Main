import { Module } from "@nestjs/common";
import { DispatcherCoreModule } from "../dispatcher/dispatcher-core.module";
import { AnalyticsApiController } from "./api/analytics.api.controller";
import { AnalyticsApiService } from "./api/analytics.api.service";
import { AnalyticsCoreService } from "./common/analytics.core.service";
import { AnalyticsRepository } from "./common/analytics.repository";

@Module({
  imports: [DispatcherCoreModule],
  controllers: [AnalyticsApiController],
  providers: [AnalyticsRepository, AnalyticsCoreService, AnalyticsApiService],
  exports: [AnalyticsCoreService],
})
export class AnalyticsModule {}
