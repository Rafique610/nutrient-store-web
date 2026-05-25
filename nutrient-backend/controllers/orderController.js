import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { formatProduct } from "./productController.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProductIdFromBody = (body) => body.productId || body.productId || body.id || body.product?._id || body.product?.id;

const formatOrder = (order) => {
  const plain = order.toObject ? order.toObject() : order;
  return {
    id: plain._id.toString(),
    _id: plain._id.toString(),
    user: plain.user?.toString(),
    products: (plain.products || []).map((item) => ({
      product: item.product?.toString(),
      title: item.title,
      price: item.price,
    })),
    totalAmount: plain.totalAmount,
    paymentStatus: plain.paymentStatus,
    paymentMethod: plain.paymentMethod,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "cart",
      populate: { path: "seller", select: "username profile role" },
    });
    const items = user.cart.map(formatProduct);
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    return res.status(200).json({
      success: true,
      data: {
        items,
        cart: items,
        count: items.length,
        totalAmount,
        cartTotal: totalAmount,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.productId || getProductIdFromBody(req.body);

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Valid productId is required" });
    }

    const [product, user] = await Promise.all([
      Product.findOne({ _id: productId, status: "published" }),
      User.findById(req.user._id),
    ]);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (user.purchased.some((ownedId) => ownedId.toString() === productId)) {
      return res.status(409).json({ success: false, message: "Product already exists in your purchased history" });
    }

    if (user.cart.some((cartId) => cartId.toString() === productId)) {
      return res.status(409).json({ success: false, message: "Product already exists in your cart" });
    }

    user.cart.push(product._id);
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate({
      path: "cart",
      populate: { path: "seller", select: "username profile role" },
    });
    const items = populatedUser.cart.map(formatProduct);

    return res.status(201).json({
      success: true,
      data: {
        items,
        cart: items,
        count: items.length,
        totalAmount: items.reduce((sum, item) => sum + item.price, 0),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.productId || getProductIdFromBody(req.body);
    const user = await User.findById(req.user._id);

    if (!productId) {
      user.cart = [];
      await user.save();

      return res.status(200).json({
        success: true,
        data: {
          items: [],
          cart: [],
          count: 0,
          totalAmount: 0,
        },
      });
    }

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Valid productId is required" });
    }

    user.cart = user.cart.filter((cartId) => cartId.toString() !== productId);
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate({
      path: "cart",
      populate: { path: "seller", select: "username profile role" },
    });
    const items = populatedUser.cart.map(formatProduct);

    return res.status(200).json({
      success: true,
      data: {
        items,
        cart: items,
        count: items.length,
        totalAmount: items.reduce((sum, item) => sum + item.price, 0),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const checkout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("cart");

    if (!user.cart.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const ownedIds = new Set(user.purchased.map((id) => id.toString()));
    const purchasableProducts = user.cart.filter((product) => !ownedIds.has(product._id.toString()));

    if (!purchasableProducts.length) {
      user.cart = [];
      await user.save();
      return res.status(409).json({
        success: false,
        message: "All cart products are already purchased",
      });
    }

    const orderProducts = purchasableProducts.map((product) => ({
      product: product._id,
      title: product.title,
      price: product.price,
    }));
    const totalAmount = orderProducts.reduce((sum, item) => sum + item.price, 0);

    const order = await Order.create({
      user: user._id,
      products: orderProducts,
      totalAmount,
      paymentStatus: "completed",
      paymentMethod: req.body.paymentMethod || "mock",
    });

    const nextPurchasedIds = new Set([
      ...user.purchased.map((id) => id.toString()),
      ...purchasableProducts.map((product) => product._id.toString()),
    ]);

    user.purchased = [...nextPurchasedIds];
    user.cart = [];
    await user.save();

    await Product.updateMany(
      { _id: { $in: purchasableProducts.map((product) => product._id) } },
      { $inc: { totalSales: 1 } }
    );

    const purchasedUser = await User.findById(user._id).populate({
      path: "purchased",
      populate: { path: "seller", select: "username profile role" },
    });

    return res.status(201).json({
      success: true,
      data: {
        order: formatOrder(order),
        library: purchasedUser.purchased.map(formatProduct),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        orders: orders.map(formatOrder),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUserLibrary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "purchased",
      populate: { path: "seller", select: "username profile role" },
    });

    return res.status(200).json({
      success: true,
      data: {
        products: user.purchased.map(formatProduct),
        library: user.purchased.map(formatProduct),
        count: user.purchased.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};

