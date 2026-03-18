import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { ROLES } from "../constants/roles";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  createOrderSchema,
  orderIdParamsSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator";

const router = Router();
const controller = new OrderController();

router.use(authenticate);
router.get("/", asyncHandler(controller.list));
router.get("/:orderId", validate({ params: orderIdParamsSchema }), asyncHandler(controller.getById));
router.post("/", validate({ body: createOrderSchema }), asyncHandler(controller.create));
router.patch(
  "/:orderId/status",
  authorize(ROLES.ADMIN),
  validate({ params: orderIdParamsSchema, body: updateOrderStatusSchema }),
  asyncHandler(controller.updateStatus),
);

export { router as orderRoutes };
