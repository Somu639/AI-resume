import Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

/**
 * Stripe billing — Checkout + Customer Portal + webhook sync.
 * Plans map to Stripe Price IDs via env.
 */

function stripe() {
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError(503, "Stripe is not configured", "STRIPE_DISABLED");
  }
  // Pin to the installed stripe package's LatestApiVersion
  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-06-24.dahlia",
  });
}

const checkoutSchema = z.object({
  priceId: z.string().min(1).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const billingService = {
  async ensureCustomer(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await stripe().customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  },

  async createCheckoutSession(userId: string, input: unknown) {
    const data = checkoutSchema.parse(input);
    const priceId = data.priceId || env.STRIPE_PRICE_PRO;
    if (!priceId) {
      throw new AppError(500, "STRIPE_PRICE_PRO is not configured");
    }

    const customerId = await this.ensureCustomer(userId);
    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        data.successUrl ||
        `${env.CLIENT_URL}/settings?billing=success`,
      cancel_url:
        data.cancelUrl || `${env.CLIENT_URL}/billing?billing=canceled`,
      metadata: { userId },
      allow_promotion_codes: true,
    });

    return { url: session.url, sessionId: session.id };
  },

  async createPortalSession(userId: string) {
    const customerId = await this.ensureCustomer(userId);
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.CLIENT_URL}/billing`,
    });
    return { url: session.url };
  },

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new AppError(404, "User not found");
    return {
      plan: user.plan,
      subscription: user.subscription,
    };
  },

  /**
   * Sync subscription state from Stripe webhooks.
   * Keeps User.plan and Subscription row consistent.
   */
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError(503, "STRIPE_WEBHOOK_SECRET is not configured");
    }

    let event: Stripe.Event;
    try {
      event = stripe().webhooks.constructEvent(
        rawBody,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      throw new AppError(400, "Invalid Stripe webhook signature");
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });
        if (!user) break;

        const statusMap: Record<string, "active" | "trialing" | "past_due" | "canceled" | "inactive"> = {
          active: "active",
          trialing: "trialing",
          past_due: "past_due",
          canceled: "canceled",
          unpaid: "past_due",
          incomplete: "inactive",
          incomplete_expired: "inactive",
          paused: "inactive",
        };

        const status = statusMap[sub.status] ?? "inactive";
        const plan =
          status === "active" || status === "trialing" ? "pro" : "free";

        // Stripe API 2026+: current_period_end lives on subscription items
        const primaryItem = sub.items.data[0];
        const periodEndUnix = primaryItem?.current_period_end;
        const currentPeriodEnd = periodEndUnix
          ? new Date(periodEndUnix * 1000)
          : null;

        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            stripeSubscriptionId: sub.id,
            stripePriceId: primaryItem?.price.id,
            status,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
          update: {
            stripeSubscriptionId: sub.id,
            stripePriceId: primaryItem?.price.id,
            status,
            currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { plan },
        });
        break;
      }
      default:
        break;
    }

    return { received: true };
  },
};
