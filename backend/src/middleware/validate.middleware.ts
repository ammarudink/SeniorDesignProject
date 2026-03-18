import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { ApiError } from "../utils/api-error";

type ValidationSchema = Partial<{
  body: ZodTypeAny;
  query: ZodTypeAny;
  params: ZodTypeAny;
}>;

export const validate =
  (schema: ValidationSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ApiError(400, "Validation failed", error.flatten()));
        return;
      }

      next(error);
    }
  };
