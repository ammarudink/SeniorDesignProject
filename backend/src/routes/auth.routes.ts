import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { loginSchema, registerSchema } from "../validators/auth.validator";

const router = Router();
const controller = new AuthController();

router.post("/register", validate({ body: registerSchema }), asyncHandler(controller.register));
router.post("/login", validate({ body: loginSchema }), asyncHandler(controller.login));
router.get("/me", authenticate, asyncHandler(controller.me));

export { router as authRoutes };
