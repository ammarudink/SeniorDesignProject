import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { cartRoutes } from "./cart.routes";
import { orderRoutes } from "./order.routes";
import { paymentRoutes } from "./payment.routes";
import { productRoutes } from "./product.routes";
import { userRoutes } from "./user.routes";
import { wishlistRoutes } from "./wishlist.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/wishlist", wishlistRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);

export { router as apiRoutes };
