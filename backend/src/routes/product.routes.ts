import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { ROLES } from "../constants/roles";
import { authenticate } from "../middleware/auth.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { attachUploadedProductImage, uploadProductImage } from "../middleware/upload.middleware";
import { validate } from "../middleware/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import {
  createProductSchema,
  dashboardQuerySchema,
  productIdParamsSchema,
  productQuerySchema,
  relatedProductsQuerySchema,
  updateProductSchema,
} from "../validators/product.validator";

const router = Router();
const controller = new ProductController();

router.get("/", validate({ query: productQuerySchema }), asyncHandler(controller.list));
router.get(
  "/dashboard",
  validate({ query: dashboardQuerySchema }),
  asyncHandler(controller.dashboard),
);
router.get("/categories", asyncHandler(controller.categories));
router.get(
  "/related",
  validate({ query: relatedProductsQuerySchema }),
  asyncHandler(controller.related),
);
router.get(
  "/:productId",
  validate({ params: productIdParamsSchema }),
  asyncHandler(controller.getById),
);
router.post(
  "/",
  authenticate,
  authorize(ROLES.ADMIN),
  uploadProductImage,
  asyncHandler(attachUploadedProductImage),
  validate({ body: createProductSchema }),
  asyncHandler(controller.create),
);
router.patch(
  "/:productId",
  authenticate,
  authorize(ROLES.ADMIN),
  uploadProductImage,
  asyncHandler(attachUploadedProductImage),
  validate({ params: productIdParamsSchema, body: updateProductSchema }),
  asyncHandler(controller.update),
);
router.delete(
  "/:productId",
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: productIdParamsSchema }),
  asyncHandler(controller.delete),
);

export { router as productRoutes };
