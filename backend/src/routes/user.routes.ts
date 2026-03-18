import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { ROLES } from "../constants/roles";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { updateUserSchema, userIdParamsSchema } from "../validators/user.validator";

const router = Router();
const controller = new UserController();

router.use(authenticate);
router.get("/", authorize(ROLES.ADMIN), asyncHandler(controller.list));
router.get("/:userId", validate({ params: userIdParamsSchema }), asyncHandler(controller.getById));
router.patch(
  "/:userId",
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  asyncHandler(controller.update),
);
router.delete("/:userId", validate({ params: userIdParamsSchema }), asyncHandler(controller.delete));

export { router as userRoutes };
