import { Module } from "@nestjs/common";
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
import { EmtModule } from "./modules/emt/emt.module";
import { EventsModule } from "./core/events/events.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [
    DbModule,
    SocketModule,
    EventsModule,
    AmbulanceProviderModule,
    PatientModule,
    DriverModule,
    AmbulanceModule,
    BookingModule,
    AnalyticsModule,
    AuthModule,
    DispatcherModule,
    HospitalModule,
    EmtModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
