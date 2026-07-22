import type { RequestHandler } from "express";
import client from "prom-client";

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "resumeai_" });

export const httpRequestDuration = new client.Histogram({
  name: "resumeai_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new client.Counter({
  name: "resumeai_http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

export const metricsMiddleware: RequestHandler = (req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const route = req.route?.path
      ? `${req.baseUrl}${req.route.path}`
      : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };
    end(labels);
    httpRequestTotal.inc(labels);
  });
  next();
};

export async function metricsHandler(_req: unknown, res: { set: Function; end: Function }) {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
}

export { register };
