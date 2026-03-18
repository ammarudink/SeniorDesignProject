import pinoHttp from "pino-http";
import { logger } from "../config/logger";

export const requestLogger = pinoHttp({
  logger,
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage(req, res) {
    return `${req.method} ${req.url} failed with ${res.statusCode}`;
  },
});
