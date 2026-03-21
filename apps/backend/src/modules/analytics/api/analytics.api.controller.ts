import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  analyticsQuerySchema,
  type AnalyticsQueryDto,
} from "@/common/validation/schemas";
import { AnalyticsApiService } from "./analytics.api.service";
import { AuthGuard } from "@/common/auth/auth.guard";
import { DispatcherRoleGuard } from "@/common/auth/dispatcher-role.guard";
import { CurrentUser } from "@/common/auth/auth.decorators";
import type { AuthUser } from "@/common/auth/auth.types";

@UseGuards(AuthGuard, DispatcherRoleGuard)
@Controller("api/analytics")
export class AnalyticsApiController {
  constructor(private readonly analyticsService: AnalyticsApiService) {}

  @Get("response")
  response(@Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto, @CurrentUser() user: AuthUser) {
    return this.analyticsService.getResponse({
      ...query,
      dispatcherId: user.id,
    });
  }

  @Get("zones")
  zones(@Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto, @CurrentUser() user: AuthUser) {
    return this.analyticsService.getZones({
      ...query,
      dispatcherId: user.id,
    });
  }

  @Get("insights")
  insights(
    @Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto,
    @CurrentUser() user: AuthUser
  ) {
    return this.analyticsService.getInsights({
      ...query,
      dispatcherId: user.id,
    });
  }

  @Get("reports")
  async reports(
    @Query(Validate(analyticsQuerySchema)) query: AnalyticsQueryDto,
    @CurrentUser() user: AuthUser,
    @Res() res: Response
  ) {
    const pdf = await this.analyticsService.reportPdf({
      ...query,
      dispatcherId: user.id,
    });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="analytics-report.pdf"');
    res.send(pdf);
  }
}
