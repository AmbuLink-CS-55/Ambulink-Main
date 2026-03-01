import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AmbulanceProviderModule } from "@/modules/ambulance-provider/ambulance-provider.module";
import { PatientModule } from "@/modules/patient/patient.module";
import { DriverModule } from "@/modules/driver/driver.module";
import { AmbulanceModule } from "@/modules/ambulance/ambulance.module";
import { BookingModule } from "./modules/booking/booking.module";
import { DbModule } from "./core/database/db.module";
import { SocketModule } from "./core/socket/socket.module";
import { DispatcherModule } from "./modules/dispatcher/dispatcher.module";
import { HealthController } from "./core/health/health.controller";
import { HospitalModule } from "./modules/hospital/hospital.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { EventsModule } from "./events/events.module";
import { AuthModule } from "./core/auth/auth.module";
import { HttpAuthGuard } from "./core/auth/http-auth.guard";
// import { WebsocketModule } from "./services/websocket-session.module";

@Module({
  imports: [
    AuthModule, // By default every HTTP controller goes through HttpAuthGuard unless marked @Public()
    DbModule,
    EventsModule,
    SocketModule,
    AmbulanceProviderModule,
    PatientModule,
    DriverModule,
    AmbulanceModule,
    BookingModule,
    DispatcherModule,
    HospitalModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: HttpAuthGuard,
    },
  ],
})
export class AppModule {}
