import { Injectable } from "@nestjs/common";
import { BookingSharedRepository } from "../common/booking.shared.repository";

@Injectable()
export class BookingFlowRepository extends BookingSharedRepository {}
