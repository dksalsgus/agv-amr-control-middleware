import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

type ErrorBody = {
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const statusCode = this.getStatusCode(exception);
    const message = this.getMessage(exception);

    if (statusCode >= 500) {
      this.logger.error(exception);
    }

    const body: ErrorBody = {
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
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
