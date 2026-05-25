import express from "express";
import {
  createAdminproduct,
  createAdminUser,
  deleteAdminproduct,
  deleteAdminUser,
  getAdminproducts,
  getAdminStats,
  getAdminUsers,
  updateAdminproduct,
  updateAdminUser,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware, authorizeRoles("admin"));

router.get("/users", getAdminUsers);
router.post("/users", createAdminUser);
router.put("/users/:id", updateAdminUser);
router.delete("/users/:id", deleteAdminUser);
router.get("/products", getAdminproducts);
router.post("/products", createAdminproduct);
router.put("/products/:id", updateAdminproduct);
router.delete("/products/:id", deleteAdminproduct);
router.get("/stats", getAdminStats);

export default router;

