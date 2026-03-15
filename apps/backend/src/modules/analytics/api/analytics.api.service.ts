import { BadRequestException, Injectable } from "@nestjs/common";
import type {
  AnalyticsAiChatDto,
  AnalyticsQueryDto,
} from "@/common/validation/schemas";
import { AnalyticsCoreService } from "../common/analytics.core.service";

@Injectable()
export class AnalyticsApiService {
  constructor(private readonly analyticsCoreService: AnalyticsCoreService) {}

  private ensureDispatcherId(dispatcherId: string | undefined) {
    if (!dispatcherId) {
      throw new BadRequestException("dispatcherId is required");
    }
    return dispatcherId;
  }

  getResponse(query: AnalyticsQueryDto) {
    const dispatcherId = this.ensureDispatcherId(query.dispatcherId);
    return this.analyticsCoreService.getResponseAnalytics(dispatcherId, query.from, query.to);
  }

  getZones(query: AnalyticsQueryDto) {
    const dispatcherId = this.ensureDispatcherId(query.dispatcherId);
    return this.analyticsCoreService.getZonesAnalytics(dispatcherId, query.from, query.to);
  }

  getInsights(query: AnalyticsQueryDto) {
    const dispatcherId = this.ensureDispatcherId(query.dispatcherId);
    return this.analyticsCoreService.getInsightsAnalytics(dispatcherId, query.from, query.to);
  }

  aiChat(body: AnalyticsAiChatDto) {
    const dispatcherId = this.ensureDispatcherId(body.dispatcherId);
    return this.analyticsCoreService.getAiAnalyticsResponse(
      dispatcherId,
      body.question,
      body.from,
      body.to
    );
  }

  reportPdf(query: AnalyticsQueryDto) {
    const dispatcherId = this.ensureDispatcherId(query.dispatcherId);
    return this.analyticsCoreService.createAnalyticsReportPdf(
      dispatcherId,
      query.from,
      query.to,
      query.bookingId
    );
  }
}
