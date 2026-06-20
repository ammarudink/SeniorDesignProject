import { Router } from "express";
import { NextFunction, Request, Response } from "express";
import passport from "passport";
import { env } from "../config/env";
import { configurePassport, isGoogleOAuthConfigured } from "../config/passport";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();
const controller = new AuthController();
configurePassport();

const requireGoogleOAuth = (_req: Request, res: Response, next: NextFunction) => {
  if (!isGoogleOAuthConfigured) {
    res.status(501).json({
      success: false,
      message: "Google OAuth is not configured",
    });
    return;
  }

  next();
};

router.post("/register", validate({ body: registerSchema }), asyncHandler(controller.register));
router.post("/login", validate({ body: loginSchema }), asyncHandler(controller.login));
router.get("/providers", asyncHandler(controller.providers));
router.get(
  "/google",
  requireGoogleOAuth,
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);
router.get(
  "/google/callback",
  requireGoogleOAuth,
  passport.authenticate("google", {
    failureRedirect: `${env.FRONTEND_URL}/login`,
    session: false,
  }),
  asyncHandler(controller.ssoCallback),
);
router.get("/me", authenticate, asyncHandler(controller.me));

export { router as authRoutes };
