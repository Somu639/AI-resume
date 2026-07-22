import type { NextFunction, Request, Response } from "express";
import { billingService } from "../services/billing.service";

export async function checkoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await billingService.createCheckoutSession(
      req.user!.id,
      req.body
    );
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function portalHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await billingService.createPortalSession(req.user!.id);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function billingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await billingService.getStatus(req.user!.id);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}

export async function stripeWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") {
      return res.status(400).json({ message: "Missing stripe-signature" });
    }
    const rawBody = req.body as Buffer;
    const data = await billingService.handleWebhook(rawBody, signature);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
}
