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

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
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
