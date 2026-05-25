import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { body } from "express-validator";
import {
  createGame,
  deleteGame,
  downloadGame,
  getGameById,
  getGames,
  updateGame,
} from "../controllers/gameController.js";
import { getGameReviews } from "../controllers/reviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import { gameImageStorage } from "../config/cloudinary.js";

const router = express.Router();

// Disk storage for game files only
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "games", "files");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .toLowerCase();
    cb(null, `${Date.now()}-${safeName}`);
  },
});

// Single custom storage engine that delegates to Cloudinary or disk
const imageFieldNames = ["coverImage", "image", "screenshots"];

const hybridStorage = {
  _handleFile(req, file, cb) {
    if (imageFieldNames.includes(file.fieldname)) {
      gameImageStorage._handleFile(req, file, cb);
    } else {
      diskStorage._handleFile(req, file, cb);
    }
  },
  _removeFile(req, file, cb) {
    if (imageFieldNames.includes(file.fieldname)) {
      gameImageStorage._removeFile(req, file, cb);
    } else {
      diskStorage._removeFile(req, file, cb);
    }
  },
};

const upload = multer({
  storage: hybridStorage,
  limits: { fileSize: 1024 * 1024 * 250, files: 10 },
});

const uploadFields = upload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "screenshots", maxCount: 6 },
  { name: "gameFile", maxCount: 1 },
]);

const createGameValidation = [
  body("title").trim().notEmpty().withMessage("Game title is required"),
  body("description").trim().notEmpty().withMessage("Game description is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body().custom((_value, { req }) => {
    if (!req.body.category && !req.body.genre) {
      throw new Error("Category or genre is required");
    }
    return true;
  }),
  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be draft or published"),
];

const updateGameValidation = [
  body("title").optional().trim().notEmpty().withMessage("Game title cannot be empty"),
  body("description").optional().trim().notEmpty().withMessage("Game description cannot be empty"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be draft or published"),
];

router.get("/", getGames);
router.get("/:id/reviews", getGameReviews);
router.get("/:id/download", authMiddleware, downloadGame);
router.get("/:id", getGameById);
router.post(
  "/",
  authMiddleware,
  authorizeRoles("developer"),
  uploadFields,
  createGameValidation,
  createGame
);
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("developer"),
  uploadFields,
  updateGameValidation,
  updateGame
);
router.delete("/:id", authMiddleware, authorizeRoles("developer"), deleteGame);

export default router;
