import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { appConfig } from "./config/app.config";
import { AppLogger } from "./logger/app-logger";
import { ConfigType } from "@nestjs/config";

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(await app.resolve(AppLogger));
  app.useGlobalFilters(new AllExceptionsFilter(await app.resolve(AppLogger)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  await app.listen(config.port);
};

void bootstrap();
