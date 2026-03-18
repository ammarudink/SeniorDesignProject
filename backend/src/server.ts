import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "./config/prisma";

const start = async () => {
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server listening on http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`Swagger UI available at http://localhost:${env.PORT}/docs`);
  });

  const shutdown = async () => {
    logger.info("Shutting down server");
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => {
    void shutdown();
  });

  process.on("SIGTERM", () => {
    void shutdown();
  });
};

void start().catch(async (error) => {
  logger.error({ error }, "Failed to start server");
  await prisma.$disconnect();
  process.exit(1);
});
