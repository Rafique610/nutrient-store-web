import express from "express";
import { body } from "express-validator";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateProfile,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const registerValidation = [
  body().custom((_value, { req }) => {
    const name = req.body.username || req.body.name || req.body.fullName;
    if (!name || String(name).trim().length < 3) {
      throw new Error("Name or username must be at least 3 characters");
    }
    return true;
  }),
  body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["customer", "developer", "admin"])
    .withMessage("Role must be customer, developer, or admin"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email address").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, loginUser);
router.get("/me", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateProfile);

export default router;
