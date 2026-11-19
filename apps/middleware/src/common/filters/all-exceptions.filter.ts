import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiResult } from "../dto/api-result";
import { AppLogger } from "../../logger/app-logger";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const statusCode = this.getStatusCode(exception);
    const message = this.getMessage(exception);

    if (statusCode >= 500) {
      this.logger.error(exception);
    }

    const body = ApiResult.ofError(statusCode, message, request.url);
    response.status(statusCode).json(body);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getMessage(exception: unknown): string | string[] {
    if (!(exception instanceof HttpException)) {
      return "Internal server error";
    }

    const response = exception.getResponse();
    if (typeof response === "string") {
      return response;
    }

    const message = (response as { message?: string | string[] }).message;
    return message ?? exception.message;
  }
}
