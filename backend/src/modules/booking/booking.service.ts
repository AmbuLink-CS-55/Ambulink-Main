import { Injectable, NotFoundException } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import { DbService } from "@/database/db.service";
import { users } from "@/database/schema";
import type {
  InsertDriverDto,
  SelectDriverDto,
} from "@/common/dto/driver.schema";
import { RedisService } from "@/database/redis.service";
import Redis from "ioredis";
import { Socket } from "socket.io";

type BookingWSs = { driverWS: Socket | null; patientWS: Socket | null };

@Injectable()
export class BookingService {
  bookingWSMap = new Map<string, BookingWSs>();
  userBookingMap = new Map<string, string>();

  createBooking(patientID: string) {
    // created on patient help
    const bookingID = crypto.randomUUID();
    this.bookingWSMap.set(bookingID, { driverWS: null, patientWS: null });
    return bookingID;
  }

  setDriverWS(bookingId: string, driverWS: Socket) {
    const existing = this.bookingWSMap.get(bookingId);
    this.bookingWSMap.set(bookingId, {
      driverWS,
      patientWS: existing?.patientWS ?? null,
    });
  }

  setPatientWS(bookingId: string, patientWS: Socket) {
    const existing = this.bookingWSMap.get(bookingId);
    this.bookingWSMap.set(bookingId, {
      driverWS: existing?.driverWS ?? null,
      patientWS,
    });
  }

  getWSByUserID(userID: string): BookingWSs | null {
    const bookingId = this.userBookingMap.get(userID);
    if (bookingId === undefined) {
      return null;
    }
    const bookingWS = this.bookingWSMap.get(bookingId);
    if (bookingWS === undefined) {
      console.log("Error: bookingWS entry not set");
      return null;
    }
    // const {driverWS, patientWS} = bookingWS
    return bookingWS;
  }

  removeBookingWS(bookingId: string) {
    this.bookingWSMap.delete(bookingId);
  }

  etBookingId(userId: string): string | undefined {
    return this.userBookingMap.get(userId);
  }
}
