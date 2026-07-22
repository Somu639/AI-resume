import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { env } from "../config/env";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  idToken: z.string().min(10),
});

function publicUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: string;
  provider: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    provider: user.provider,
  };
}

function issueTokens(user: {
  id: string;
  email: string;
  plan: string;
}) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id),
  };
}

export const authService = {
  async register(input: unknown) {
    const data = registerSchema.parse(input);
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      throw new AppError(409, "Email already registered", "EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        name: data.name,
        provider: "email",
      },
    });

    return { user: publicUser(user), ...issueTokens(user) };
  },

  async login(input: unknown) {
    const data = loginSchema.parse(input);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (!user?.passwordHash) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    return { user: publicUser(user), ...issueTokens(user) };
  },

  async google(input: unknown) {
    const data = googleSchema.parse(input);
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError(503, "Google login is not configured");
    }

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: data.idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub) {
      throw new AppError(401, "Invalid Google token");
    }

    const email = payload.email.toLowerCase();
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: payload.sub }, { email }],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId: payload.sub,
          name: payload.name,
          avatarUrl: payload.picture,
          provider: "google",
        },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          avatarUrl: user.avatarUrl ?? payload.picture,
          provider: user.passwordHash ? user.provider : "google",
        },
      });
    }

    return { user: publicUser(user), ...issueTokens(user) };
  },

  async refresh(refreshToken: string) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new AppError(401, "User not found");
      return { user: publicUser(user), ...issueTokens(user) };
    } catch {
      throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH");
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new AppError(404, "User not found");
    return {
      ...publicUser(user),
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
    };
  },
};
