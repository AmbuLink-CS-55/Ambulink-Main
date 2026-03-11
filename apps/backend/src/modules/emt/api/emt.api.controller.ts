import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { Validate } from "@/common/pipes/zod-validation.pipe";
import {
  createEmtSchema,
  emtBookingSearchQuerySchema,
  emtListQuerySchema,
  updateEmtSchema,
  type CreateEmtDto,
  type EmtBookingSearchQueryDto,
  type EmtListQueryDto,
  type UpdateEmtDto,
} from "@/common/validation/schemas";
import { EmtApiService } from "./emt.api.service";

@Controller("api/emts")
export class EmtApiController {
  constructor(private readonly emtService: EmtApiService) {}

  @Post()
  create(
    @Body(Validate(createEmtSchema))
    body: CreateEmtDto
  ) {
    return this.emtService.create(body);
  }

  @Get()
  findAll(@Query(Validate(emtListQuerySchema)) query: EmtListQueryDto) {
    return this.emtService.findAll(query.providerId, query.isActive, query.status);
  }

  @Get("bookings/search")
  searchBookings(
    @Query("emtId") emtId: string | undefined,
    @Query(Validate(emtBookingSearchQuerySchema)) query: EmtBookingSearchQueryDto
  ) {
    if (!emtId) {
      throw new BadRequestException("emtId is required");
    }

    return this.emtService.searchOngoingBookings(emtId, query.q, query.limit);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.emtService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(Validate(updateEmtSchema))
    body: UpdateEmtDto
  ) {
    return this.emtService.update(id, body);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.emtService.remove(id);
  }
}
