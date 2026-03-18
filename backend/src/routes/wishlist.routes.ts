import { Router } from "express";
import { WishlistController } from "../controllers/wishlist.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  addWishlistItemSchema,
  wishlistIdParamsSchema,
} from "../validators/wishlist.validator";

const router = Router();
const controller = new WishlistController();

router.use(authenticate);
router.get("/", asyncHandler(controller.list));
router.post("/", validate({ body: addWishlistItemSchema }), asyncHandler(controller.add));
router.delete(
  "/:productId",
  validate({ params: wishlistIdParamsSchema }),
  asyncHandler(controller.remove),
);

export { router as wishlistRoutes };
