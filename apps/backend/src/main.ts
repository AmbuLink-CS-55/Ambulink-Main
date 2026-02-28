import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Logger } from "@nestjs/common";
import { AppModule } from "@/app.module";
import env from "../env";
import { AllExceptionsFilter } from "@/common/filters/all-exceptions.filter";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = [
    env.FRONTEND_URL,
    ...(env.FRONTEND_URLS?.split(",").map((origin) => origin.trim()) ?? []),
  ].filter((origin): origin is string => Boolean(origin));
  const defaultDevOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
  const allowedOrigins =
    configuredOrigins.length > 0
      ? configuredOrigins
      : env.APP_STAGE === "dev"
        ? defaultDevOrigins
        : [];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow native/mobile and same-origin requests without Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useGlobalFilters(new AllExceptionsFilter());

  // API Docs setup
  const config = new DocumentBuilder()
    .setTitle("AmbuLink API")
    .setDescription("AmbuLink API documentation")
    .setVersion("1.0")
    .addTag("drivers", "Driver management endpoints")
    .addTag("ambulances", "Ambulance management endpoints")
    .addTag("patients", "Patient management endpoints")
    .addTag("hospitals", "Hospital information endpoints")
    .addTag("health", "Health check endpoints")
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, documentFactory);

  await app.listen(env.PORT);
  logger.log(`Server running on http://localhost:${env.PORT}`);
  logger.log(`API docs available at http://localhost:${env.PORT}/docs`);
}

bootstrap().catch((error) => {
  Logger.error("Failed to start server", error);
  throw error;
});
