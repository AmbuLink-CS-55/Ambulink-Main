import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types";

import { AppModule } from "../../src/app.module";
import { DbService } from "../../src/core/database/db.service";
import { seedTestDatabase } from "./seed-db";

export async function createSeededApp() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for e2e tests");
  }

  await seedTestDatabase(databaseUrl);

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleFixture.createNestApplication();
  await app.init();

  const dbService = app.get(DbService);
  const http = request(app.getHttpServer());

  return {
    app,
    dbService,
    http,
  };
}
