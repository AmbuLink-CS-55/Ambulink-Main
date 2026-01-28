import { Module } from "@nestjs/common";
import { AmbulanceProviderModule } from "@/modules/ambulance_providers/ambulance-provider.module";
import { PatientModule } from "@/modules/patients/patient.module";
import { DriverModule } from "@/modules/drivers/driver.module";
import { AmbulanceModule } from "@/modules/ambulance/ambulance.module";
import { BookingModule } from "./modules/booking/booking.module";
// import { WebsocketModule } from "./services/websocket-session.module";

@Module({
  imports: [
    AmbulanceProviderModule,
    PatientModule,
    DriverModule,
    AmbulanceModule,
    BookingModule,
  ],
})
export class AppModule { }
