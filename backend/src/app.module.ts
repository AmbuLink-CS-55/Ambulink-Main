import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { RedisClientOptions } from "redis";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DbModule } from "./db/db.module";
import { AmbulanceProviderModule } from "./modules/ambulance_providers/ambulance-provider.module";
import { PatientModule } from "./modules/patients/patient.module";
import { DriverModule } from "./modules/drivers/driver.module";
import { AmbulanceModule } from "./modules/ambulance/ambulance.module";
import { WsModule } from "./modules/ws/ws.module";

@Module({
  imports: [
    DbModule,
    AmbulanceProviderModule,
    PatientModule,
    DriverModule,
    AmbulanceModule,
    CacheModule.registerAsync<RedisClientOptions>({
      useFactory: () => ({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        ttl: 5 * 60 * 1000,
        isGlobal: true,
      }),
    }),
    WsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
