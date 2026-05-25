import express from "express";
import {
  createAdminGame,
  createAdminUser,
  deleteAdminGame,
  deleteAdminUser,
  getAdminGames,
  getAdminStats,
  getAdminUsers,
  updateAdminGame,
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
router.get("/games", getAdminGames);
router.post("/games", createAdminGame);
router.put("/games/:id", updateAdminGame);
router.delete("/games/:id", deleteAdminGame);
router.get("/stats", getAdminStats);

export default router;
