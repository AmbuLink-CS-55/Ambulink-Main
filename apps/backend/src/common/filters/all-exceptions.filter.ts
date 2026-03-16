import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

type NormalizedError = {
  code: string;
  message: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = isHttpException ? exception.getResponse() : "Internal server error";
    const normalizedError = this.normalizeError(errorResponse, status);

    if (!isHttpException) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(
        `HTTP ${status} on ${request.method} ${request.url} [${normalizedError.code}] ${normalizedError.message}`
      );
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      code: normalizedError.code,
      message: normalizedError.message,
      error: errorResponse,
    });
  }

  private normalizeError(errorResponse: unknown, status: number): NormalizedError {
    const fallbackCode = this.getFallbackCode(status);
    const fallbackMessage = status >= 500 ? "Internal server error" : "Request failed";

    if (typeof errorResponse === "string") {
      return { code: fallbackCode, message: errorResponse };
    }

    if (!errorResponse || typeof errorResponse !== "object") {
      return { code: fallbackCode, message: fallbackMessage };
    }

    const payload = errorResponse as Record<string, unknown>;
    const code = typeof payload.code === "string" ? payload.code : fallbackCode;

    if (typeof payload.message === "string") {
      return { code, message: payload.message };
    }

    if (Array.isArray(payload.message) && typeof payload.message[0] === "string") {
      return { code, message: payload.message[0] };
    }

    if (typeof payload.error === "string") {
      return { code, message: payload.error };
    }

    return { code, message: fallbackMessage };
  }

  private getFallbackCode(status: number): string {
    if (status >= 500) return "INTERNAL_SERVER_ERROR";
    if (status === HttpStatus.BAD_REQUEST) return "BAD_REQUEST";
    if (status === HttpStatus.UNAUTHORIZED) return "UNAUTHORIZED";
    if (status === HttpStatus.FORBIDDEN) return "FORBIDDEN";
    if (status === HttpStatus.NOT_FOUND) return "NOT_FOUND";
    if (status === HttpStatus.CONFLICT) return "CONFLICT";
    return "REQUEST_FAILED";
  }
}
