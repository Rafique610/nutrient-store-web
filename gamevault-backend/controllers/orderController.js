import mongoose from "mongoose";
import Game from "../models/Game.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { formatGame } from "./gameController.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getGameIdFromBody = (body) => body.gameId || body.id || body.game?._id || body.game?.id;

const formatOrder = (order) => {
  const plain = order.toObject ? order.toObject() : order;
  return {
    id: plain._id.toString(),
    _id: plain._id.toString(),
    user: plain.user?.toString(),
    games: plain.games.map((item) => ({
      game: item.game?.toString(),
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
      populate: { path: "developer", select: "username profile role" },
    });
    const items = user.cart.map(formatGame);
    const totalAmount = items.reduce((sum, game) => sum + game.price, 0);

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
    const gameId = req.params.gameId || getGameIdFromBody(req.body);

    if (!isValidObjectId(gameId)) {
      return res.status(400).json({ success: false, message: "Valid gameId is required" });
    }

    const [game, user] = await Promise.all([
      Game.findOne({ _id: gameId, status: "published" }),
      User.findById(req.user._id),
    ]);

    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (user.library.some((ownedId) => ownedId.toString() === gameId)) {
      return res.status(409).json({ success: false, message: "Game already exists in your library" });
    }

    if (user.cart.some((cartId) => cartId.toString() === gameId)) {
      return res.status(409).json({ success: false, message: "Game already exists in your cart" });
    }

    user.cart.push(game._id);
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate({
      path: "cart",
      populate: { path: "developer", select: "username profile role" },
    });
    const items = populatedUser.cart.map(formatGame);

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
    const gameId = req.params.gameId || getGameIdFromBody(req.body);
    const user = await User.findById(req.user._id);

    if (!gameId) {
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

    if (!isValidObjectId(gameId)) {
      return res.status(400).json({ success: false, message: "Valid gameId is required" });
    }

    user.cart = user.cart.filter((cartId) => cartId.toString() !== gameId);
    await user.save();

    const populatedUser = await User.findById(req.user._id).populate({
      path: "cart",
      populate: { path: "developer", select: "username profile role" },
    });
    const items = populatedUser.cart.map(formatGame);

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

    const ownedIds = new Set(user.library.map((id) => id.toString()));
    const purchasableGames = user.cart.filter((game) => !ownedIds.has(game._id.toString()));

    if (!purchasableGames.length) {
      user.cart = [];
      await user.save();
      return res.status(409).json({
        success: false,
        message: "All cart games are already in your library",
      });
    }

    const orderGames = purchasableGames.map((game) => ({
      game: game._id,
      title: game.title,
      price: game.price,
    }));
    const totalAmount = orderGames.reduce((sum, item) => sum + item.price, 0);

    const order = await Order.create({
      user: user._id,
      games: orderGames,
      totalAmount,
      paymentStatus: "completed",
      paymentMethod: req.body.paymentMethod || "mock",
    });

    const nextLibraryIds = new Set([
      ...user.library.map((id) => id.toString()),
      ...purchasableGames.map((game) => game._id.toString()),
    ]);

    user.library = [...nextLibraryIds];
    user.cart = [];
    await user.save();

    await Game.updateMany(
      { _id: { $in: purchasableGames.map((game) => game._id) } },
      { $inc: { totalSales: 1 } }
    );

    const libraryUser = await User.findById(user._id).populate({
      path: "library",
      populate: { path: "developer", select: "username profile role" },
    });

    return res.status(201).json({
      success: true,
      data: {
        order: formatOrder(order),
        library: libraryUser.library.map(formatGame),
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
      path: "library",
      populate: { path: "developer", select: "username profile role" },
    });

    return res.status(200).json({
      success: true,
      data: {
        games: user.library.map(formatGame),
        library: user.library.map(formatGame),
        count: user.library.length,
      },
    });
  } catch (error) {
    return next(error);
  }
};
