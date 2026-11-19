import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { AppLogger } from "./logger/app-logger";

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(await app.resolve(AppLogger));
  app.useGlobalFilters(new AllExceptionsFilter(await app.resolve(AppLogger)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
};

void bootstrap();
