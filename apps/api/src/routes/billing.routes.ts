import { Router } from "express";
import {
  billingStatusHandler,
  checkoutHandler,
  portalHandler,
} from "../controllers/billing.controller";
import { authMiddleware } from "../middleware/auth";

/** Authenticated billing endpoints (webhook is mounted separately with raw body). */
export const billingRouter = Router();

billingRouter.use(authMiddleware);
billingRouter.get("/status", billingStatusHandler);
billingRouter.post("/checkout", checkoutHandler);
billingRouter.post("/portal", portalHandler);
