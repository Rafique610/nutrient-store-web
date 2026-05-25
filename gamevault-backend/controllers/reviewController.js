import mongoose from "mongoose";
import { validationResult } from "express-validator";
import Game from "../models/Game.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validationMessage = (req) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map((error) => error.msg).join(", ");
};

const getGameIdFromBody = (body) => body.gameId || body.game;

const formatReview = (review) => {
  const plain = review.toObject ? review.toObject() : review;
  const user = plain.user && typeof plain.user === "object" ? plain.user : null;
  const userName = user?.profile?.fullName || user?.username || "GameVault User";
  const gameId = plain.game && typeof plain.game === "object" ? plain.game._id : plain.game;

  return {
    id: plain._id.toString(),
    _id: plain._id.toString(),
    game: gameId?.toString(),
    gameId: gameId?.toString(),
    user: user?._id?.toString() || plain.user?.toString(),
    userId: user?._id?.toString() || plain.user?.toString(),
    userName,
    rating: plain.rating,
    comment: plain.comment,
    text: plain.comment,
    date: plain.createdAt ? new Date(plain.createdAt).toISOString().split("T")[0] : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const userOwnsGame = async (userId, gameId) => {
  const user = await User.findById(userId).select("library");
  if (!user) return false;

  const ownsInLibrary = user.library.some((ownedId) => ownedId.toString() === gameId.toString());

  if (ownsInLibrary) return true;

  const order = await Order.exists({
    user: userId,
    paymentStatus: "completed",
    "games.game": gameId,
  });

  return Boolean(order);
};

export const updateGameRating = async (gameId) => {
  const stats = await Review.aggregate([
    { $match: { game: new mongoose.Types.ObjectId(gameId) } },
    {
      $group: {
        _id: "$game",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (!stats.length) {
    await Game.findByIdAndUpdate(gameId, { averageRating: 0, totalReviews: 0 });
    return;
  }

  await Game.findByIdAndUpdate(gameId, {
    averageRating: Math.round(stats[0].averageRating * 10) / 10,
    totalReviews: stats[0].totalReviews,
  });
};

export const createReview = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    const gameId = getGameIdFromBody(req.body);
    if (!isValidObjectId(gameId)) {
      return res.status(400).json({ success: false, message: "Valid gameId is required" });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (!(await userOwnsGame(req.user._id, game._id))) {
      return res.status(403).json({
        success: false,
        message: "You must own this game to review it",
      });
    }

    const existingReview = await Review.findOne({ user: req.user._id, game: game._id });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this game",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      game: game._id,
      rating: Number(req.body.rating),
      comment: req.body.comment || req.body.text,
    });

    await updateGameRating(game._id);
    await review.populate("user", "username profile");

    return res.status(201).json({
      success: true,
      data: {
        review: formatReview(review),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getGameReviews = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid game id" });
    }

    const reviews = await Review.find({ game: req.params.id })
      .populate("user", "username profile")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        reviews: reviews.map(formatReview),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review",
      });
    }

    if (typeof req.body.rating !== "undefined") review.rating = Number(req.body.rating);
    if (req.body.comment || req.body.text) review.comment = req.body.comment || req.body.text;

    await review.save();
    await updateGameRating(review.game);
    await review.populate("user", "username profile");

    return res.status(200).json({
      success: true,
      data: {
        review: formatReview(review),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid review id" });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review",
      });
    }

    const gameId = review.game;
    await Review.findByIdAndDelete(review._id);
    await updateGameRating(gameId);

    return res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        message: "Review deleted successfully",
      },
    });
  } catch (error) {
    return next(error);
  }
};
