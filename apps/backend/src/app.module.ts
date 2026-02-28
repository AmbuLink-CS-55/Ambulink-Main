import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AmbulanceProviderModule } from "@/modules/ambulance_providers/ambulance-provider.module";
import { PatientModule } from "@/modules/patients/patient.module";
import { DriverModule } from "@/modules/drivers/driver.module";
import { AmbulanceModule } from "@/modules/ambulance/ambulance.module";
import { BookingModule } from "./modules/booking/booking.module";
import { DbModule } from "./common/database/db.module";
import { SocketModule } from "./common/socket/socket.module";
import { DispatcherModule } from "./modules/dispatcher/dispatcher.module";
import { HealthController } from "./common/health/health.controller";
import { HospitalModule } from "./modules/hospital/hospital.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { EventsModule } from "./common/events/events.module";
import { AuthModule } from "./common/auth/auth.module";
import { HttpAuthGuard } from "./common/auth/http-auth.guard";
// import { WebsocketModule } from "./services/websocket-session.module";

@Module({
  imports: [
    AuthModule,
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
