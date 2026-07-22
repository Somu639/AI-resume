import type { StringValue } from "ms";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  plan: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
};

export function signAccessToken(user: {
  id: string;
  email: string;
  plan: string;
}): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    plan: user.plan,
    type: "access",
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
  });
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshTokenPayload = { sub: userId, type: "refresh" };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  if (decoded.type !== "access") throw new Error("Invalid token type");
  return decoded;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(
    token,
    env.JWT_REFRESH_SECRET
  ) as RefreshTokenPayload;
  if (decoded.type !== "refresh") throw new Error("Invalid token type");
  return decoded;
}
