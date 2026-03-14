import { Injectable } from "@nestjs/common";
import type {
  AnalyticsAiChatDto,
  AnalyticsQueryDto,
} from "@/common/validation/schemas";
import { AnalyticsCoreService } from "../common/analytics.core.service";

@Injectable()
export class AnalyticsApiService {
  constructor(private readonly analyticsCoreService: AnalyticsCoreService) {}

  getResponse(query: AnalyticsQueryDto) {
    return this.analyticsCoreService.getResponseAnalytics(query.dispatcherId, query.from, query.to);
  }

  getZones(query: AnalyticsQueryDto) {
    return this.analyticsCoreService.getZonesAnalytics(query.dispatcherId, query.from, query.to);
  }

  getInsights(query: AnalyticsQueryDto) {
    return this.analyticsCoreService.getInsightsAnalytics(query.dispatcherId, query.from, query.to);
  }

  aiChat(body: AnalyticsAiChatDto) {
    return this.analyticsCoreService.getAiAnalyticsResponse(
      body.dispatcherId,
      body.question,
      body.from,
      body.to
    );
  }

  reportPdf(query: AnalyticsQueryDto) {
    return this.analyticsCoreService.createAnalyticsReportPdf(
      query.dispatcherId,
      query.from,
      query.to,
      query.bookingId
    );
  }
}
