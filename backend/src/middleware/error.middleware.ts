import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";
import { ApiError } from "../utils/api-error";

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A record with the same unique field already exists",
      });
      return;
    }

    if (error.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Requested record was not found",
      });
      return;
    }
  }

  logger.error(
    {
      error,
      path: req.originalUrl,
      method: req.method,
    },
    "Unhandled request error",
  );

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
