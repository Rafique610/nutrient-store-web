import express from "express";
import {
  addToCart,
  checkout,
  getCart,
  getUserLibrary,
  getUserOrders,
  removeFromCart,
} from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/cart", getCart);
router.post("/cart", addToCart);
router.post("/cart/:productId", addToCart);
router.delete("/cart", removeFromCart);
router.delete("/cart/:productId", removeFromCart);
router.post("/checkout", checkout);
router.get("/library", getUserLibrary);
router.get("/", getUserOrders);

export default router;
