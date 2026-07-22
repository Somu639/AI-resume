import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: "resumeai-api",
    env: env.NODE_ENV,
  },
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:standard" },
        }
      : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "passwordHash",
      "token",
      "OPENAI_API_KEY",
      "AWS_SECRET_ACCESS_KEY",
    ],
    remove: true,
  },
});
