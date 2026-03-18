import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { openApiSpec } from "./docs/openapi";
import { errorHandler } from "./middleware/error.middleware";
import { notFoundHandler } from "./middleware/not-found.middleware";
import { requestLogger } from "./middleware/request-logger.middleware";
import { apiRoutes } from "./routes";

const localOrigins = [
  "http://localhost",
  "http://127.0.0.1",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

export const app = express();

app.disable("x-powered-by");
app.use(requestLogger);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (localOrigins.some((allowedOrigin) => origin.startsWith(allowedOrigin))) {
        callback(null, true);
        return;
      }

      if (origin === env.CORS_ORIGIN) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

app.get(env.API_PREFIX, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "SenioDesign API is running",
    docs: "/docs",
    health: "/health",
  });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use(env.API_PREFIX, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
