import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { RedisClientOptions } from "redis";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DbModule } from "./db/db.module";
import { ServiceModule } from "./modules/service/service.module";
import { UserModule } from "./modules/user/user.module";
import { DriverModule } from "./modules/driver/driver.module";
import { EmtModule } from "./modules/emt/emt.module";
import { AmbulanceModule } from "./modules/ambulance/ambulance.module";

@Module({
  imports: [
    DbModule,
    ServiceModule,
    UserModule,
    DriverModule,
    EmtModule,
    AmbulanceModule,
    CacheModule.registerAsync<RedisClientOptions>({
      useFactory: () => ({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        ttl: 5 * 60 * 1000,
        isGlobal: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
