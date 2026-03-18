import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  addCartItemSchema,
  cartIdParamsSchema,
  updateCartItemSchema,
} from "../validators/cart.validator";

const router = Router();
const controller = new CartController();

router.use(authenticate);
router.get("/", asyncHandler(controller.list));
router.post("/", validate({ body: addCartItemSchema }), asyncHandler(controller.add));
router.patch(
  "/:cartId",
  validate({ params: cartIdParamsSchema, body: updateCartItemSchema }),
  asyncHandler(controller.update),
);
router.delete("/:cartId", validate({ params: cartIdParamsSchema }), asyncHandler(controller.remove));
router.delete("/", asyncHandler(controller.clear));

export { router as cartRoutes };
