import Game from "../models/Game.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { formatGame } from "./gameController.js";
import { formatUser } from "./authController.js";

export const getAdminUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role && ["customer", "developer", "admin"].includes(req.query.role)) {
      query.role = req.query.role;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ username: regex }, { email: regex }, { "profile.fullName": regex }];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        users: users.map(formatUser),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminGames = async (req, res, next) => {
  try {
    const games = await Game.find()
      .populate("developer", "username profile role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        games: games.map(formatGame),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminStats = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalGames,
      totalOrders,
      activeGames,
      pendingApprovals,
      totalCustomers,
      totalDevelopers,
      revenue,
    ] = await Promise.all([
      User.countDocuments(),
      Game.countDocuments(),
      Order.countDocuments(),
      Game.countDocuments({ status: "published" }),
      Game.countDocuments({ status: "draft" }),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "developer" }),
      Order.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalGames,
        totalOrders,
        totalRevenue: revenue[0]?.totalRevenue || 0,
        activeGames,
        pendingApprovals,
        totalCustomers,
        totalDevelopers,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createAdminUser = async (req, res, next) => {
  try {
    const name = req.body.username || req.body.name || req.body.fullName;
    const { email, password, role = "customer" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (!["customer", "developer", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be customer, developer, or admin",
      });
    }

    const user = await User.create({
      username: name,
      email: email.toLowerCase(),
      password,
      role,
      profile: {
        fullName: name,
        avatar: req.body.avatar || "",
        bio: req.body.bio || "",
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        user: formatUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const name = req.body.username || req.body.name || req.body.fullName;
    if (name) {
      user.username = name;
      user.profile.fullName = name;
    }

    if (req.body.email) user.email = req.body.email.toLowerCase();
    if (req.body.role && ["customer", "developer", "admin"].includes(req.body.role)) {
      user.role = req.body.role;
    }
    if (typeof req.body.avatar === "string") user.profile.avatar = req.body.avatar;
    if (typeof req.body.bio === "string") user.profile.bio = req.body.bio;
    if (req.body.password) user.password = req.body.password;

    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        user: formatUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAdminUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await Promise.all([
      Review.deleteMany({ user: user._id }),
      Order.deleteMany({ user: user._id }),
      Game.updateMany({ developer: user._id }, { status: "draft" }),
      User.findByIdAndDelete(user._id),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        message: "User deleted successfully",
      },
    });
  } catch (error) {
    return next(error);
  }
};

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const createAdminGame = async (req, res, next) => {
  try {
    const { title, description, price } = req.body;
    const category = req.body.category || req.body.genre;
    const developerUser = req.body.developerId
      ? await User.findById(req.body.developerId)
      : req.user;

    if (!title || !description || typeof price === "undefined" || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, price, and category are required",
      });
    }

    if (!developerUser) {
      return res.status(404).json({
        success: false,
        message: "Developer user not found",
      });
    }

    const game = await Game.create({
      title,
      description,
      developer: developerUser._id,
      developerName: req.body.developer || developerUser.profile?.fullName || developerUser.username,
      price: Number(price),
      category,
      coverImage: req.body.coverImage || req.body.image || "",
      screenshots: parseList(req.body.screenshots),
      gameFile: req.body.gameFile || "",
      status: req.body.status || "published",
      tags: parseList(req.body.tags || category),
      isFeatured: Boolean(req.body.isFeatured),
      releaseDate: req.body.releaseDate || new Date(),
    });

    await game.populate("developer", "username profile role");

    return res.status(201).json({
      success: true,
      data: {
        game: formatGame(game),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminGame = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    ["title", "description", "status", "coverImage", "gameFile", "releaseDate"].forEach((field) => {
      if (typeof req.body[field] !== "undefined") game[field] = req.body[field];
    });

    if (typeof req.body.price !== "undefined") game.price = Number(req.body.price);
    if (req.body.category || req.body.genre) game.category = req.body.category || req.body.genre;
    if (req.body.developer) game.developerName = req.body.developer;
    if (typeof req.body.tags !== "undefined") game.tags = parseList(req.body.tags);
    if (typeof req.body.screenshots !== "undefined") game.screenshots = parseList(req.body.screenshots);
    if (typeof req.body.isFeatured !== "undefined") game.isFeatured = Boolean(req.body.isFeatured);

    await game.save();
    await game.populate("developer", "username profile role");

    return res.status(200).json({
      success: true,
      data: {
        game: formatGame(game),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAdminGame = async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    await Promise.all([
      Review.deleteMany({ game: game._id }),
      User.updateMany({}, { $pull: { cart: game._id, library: game._id } }),
      Game.findByIdAndDelete(game._id),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        message: "Game deleted successfully",
      },
    });
  } catch (error) {
    return next(error);
  }
};
