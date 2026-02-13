import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { AppModule } from "@/app.module";
import env from "../env";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: env.FRONTEND_URL || "*",
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));

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

  await app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`API docs available at http://localhost:${env.PORT}/docs`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
