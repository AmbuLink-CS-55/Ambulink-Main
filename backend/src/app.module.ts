import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { RedisClientOptions } from "redis";
import { AmbulanceProviderModule } from "@/modules/ambulance_providers/ambulance-provider.module";
import { PatientModule } from "@/modules/patients/patient.module";
import { DriverModule } from "@/modules/drivers/driver.module";
import { AmbulanceModule } from "@/modules/ambulance/ambulance.module";
import { BookingModule } from "./modules/booking/booking.module";
import { WebsocketModule } from "./services/websocket-session.module";

@Module({
  imports: [
    AmbulanceProviderModule,
    PatientModule,
    DriverModule,
    AmbulanceModule,
    BookingModule,
    WebsocketModule
    // CacheModule.registerAsync<RedisClientOptions>({
    //   isGlobal: true,
    //   useFactory: () => ({
    //     host: process.env.REDIS_HOST || "localhost",
    //     port: parseInt(process.env.REDIS_PORT || "6379"),
    //     ttl: 5 * 60 * 1000,
    //   }),
    // }),
  ],
})
export class AppModule {}
