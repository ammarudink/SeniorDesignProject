import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";

export const authorize =
  (...allowedRoles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new ApiError(401, "Authentication is required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError(403, "Access denied"));
      return;
    }

    next();
  };
