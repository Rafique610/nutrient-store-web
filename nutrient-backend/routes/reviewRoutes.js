import express from "express";
import { body } from "express-validator";
import {
  createReview,
  deleteReview,
  updateReview,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const createReviewValidation = [
  body().custom((_value, { req }) => {
    if (!req.body.productId && !req.body.productId && !req.body.product) {
      throw new Error("productId is required");
    }
    return true;
  }),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body().custom((_value, { req }) => {
    const comment = req.body.comment || req.body.text;
    if (!comment || String(comment).trim().length < 3) {
      throw new Error("Review comment must be at least 3 characters");
    }
    return true;
  }),
];

const updateReviewValidation = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body().custom((_value, { req }) => {
    if (typeof req.body.comment === "undefined" && typeof req.body.text === "undefined") {
      return true;
    }
    const comment = req.body.comment || req.body.text;
    if (!comment || String(comment).trim().length < 3) {
      throw new Error("Review comment must be at least 3 characters");
    }
    return true;
  }),
];

router.post("/", authMiddleware, createReviewValidation, createReview);
router.put("/:id", authMiddleware, updateReviewValidation, updateReview);
router.delete("/:id", authMiddleware, deleteReview);

export default router;

