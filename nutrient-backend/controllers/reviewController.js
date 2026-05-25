import mongoose from "mongoose";
import { validationResult } from "express-validator";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validationMessage = (req) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map((error) => error.msg).join(", ");
};

const getProductIdFromBody = (body) => body.productId || body.productId || body.product || body.product;

const formatReview = (review) => {
  const plain = review.toObject ? review.toObject() : review;
  const user = plain.user && typeof plain.user === "object" ? plain.user : null;
  const userName = user?.profile?.fullName || user?.username || "NutriFactor User";
  const productId = plain.product && typeof plain.product === "object" ? plain.product._id : plain.product;

  return {
    id: plain._id.toString(),
    _id: plain._id.toString(),
    product: productId?.toString(),
    productId: productId?.toString(),
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

const userOwnsProduct = async (userId, productId) => {
  const user = await User.findById(userId).select("purchased");
  if (!user) return false;

  const ownsInPurchased = user.purchased.some((ownedId) => ownedId.toString() === productId.toString());

  if (ownsInPurchased) return true;

  const order = await Order.exists({
    user: userId,
    paymentStatus: "completed",
    "products.product": productId,
  });

  return Boolean(order);
};

export const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (!stats.length) {
    await Product.findByIdAndUpdate(productId, { averageRating: 0, totalReviews: 0 });
    return;
  }

  await Product.findByIdAndUpdate(productId, {
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

    const productId = getProductIdFromBody(req.body);
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Valid productId is required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (!(await userOwnsProduct(req.user._id, product._id))) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this product to review it",
      });
    }

    const existingReview = await Review.findOne({ user: req.user._id, product: product._id });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await Review.create({
      user: req.user._id,
      product: product._id,
      rating: Number(req.body.rating),
      comment: req.body.comment || req.body.text,
    });

    await updateProductRating(product._id);
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

export const getproductReviews = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const reviews = await Review.find({ product: req.params.id })
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
    await updateProductRating(review.product);
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

    const productId = review.product;
    await Review.findByIdAndDelete(review._id);
    await updateProductRating(productId);

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

