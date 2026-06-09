import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppModule } from "../../src/app.module";
import { ALL_ENTITIES } from "../../src/data-source";

export async function createTestApp() {
  process.env.NODE_ENV = "test";
  process.env.E2E_SQLITE = "1";
  process.env.JWT_SECRET = "test-secret-key-32-chars-minimum!!";
  process.env.JWT_EXPIRES_IN = "8h";

  const app = await NestFactory.create(AppModule, { logger: false });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix("api", { exclude: ["health"] });

  await app.init();
  return app;
}

export async function closeTestApp(app: any) {
  await app.close();
}