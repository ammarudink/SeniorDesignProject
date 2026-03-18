import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { ROLES } from "../constants/roles";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { createPaymentSchema } from "../validators/payment.validator";

const router = Router();
const controller = new PaymentController();

router.use(authenticate);
router.get("/", authorize(ROLES.ADMIN), asyncHandler(controller.list));
router.post("/", validate({ body: createPaymentSchema }), asyncHandler(controller.create));

export { router as paymentRoutes };
