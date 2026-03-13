import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  analyticsAiChatSchema,
  analyticsQuerySchema,
  type AnalyticsAiChatDto,
  type AnalyticsQueryDto,
} from "@/common/validation/schemas";
import { AnalyticsApiService } from "./analytics.api.service";

@Controller("api/analytics")
export class AnalyticsApiController {
  constructor(private readonly analyticsService: AnalyticsApiService) {}

  @Get("response")
  response(@Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto) {
    return this.analyticsService.getResponse(query);
  }

  @Get("zones")
  zones(@Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto) {
    return this.analyticsService.getZones(query);
  }

  @Get("insights")
  insights(@Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto) {
    return this.analyticsService.getInsights(query);
  }

  @Post("ai-chat")
  aiChat(@Body(Validate(analyticsAiChatSchema)) body: AnalyticsAiChatDto) {
    return this.analyticsService.aiChat(body);
  }

  @Get("reports")
  async reports(
    @Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto,
    @Res() res: Response
  ) {
    const pdf = await this.analyticsService.reportPdf(query);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="analytics-report.pdf"');
    res.send(pdf);
  }
}
