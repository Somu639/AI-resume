import { Router } from "express";
import {
  authMiddleware,
  googleHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  refreshHandler,
  registerHandler,
} from "../controllers/auth.controller";

/** Auth routes — email/password + Google ID token exchange. */
export const authRouter = Router();

authRouter.post("/register", registerHandler);
authRouter.post("/login", loginHandler);
authRouter.post("/google", googleHandler);
authRouter.post("/refresh", refreshHandler);
authRouter.post("/logout", logoutHandler);
authRouter.get("/me", authMiddleware, meHandler);
