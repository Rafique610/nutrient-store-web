import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { validationResult } from "express-validator";
import Game from "../models/Game.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

const validationMessage = (req) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map((error) => error.msg).join(", ");
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const relativeUploadPath = (file) => path.relative(process.cwd(), file.path).replace(/\\/g, "/");
const publicUploadPath = (file) => {
  // Cloudinary returns a full https:// URL in file.path
  if (file.path && file.path.startsWith("http")) return file.path;
  return `/${relativeUploadPath(file)}`;
};
const storedUploadPath = (file) => {
  if (file.path && file.path.startsWith("http")) return file.path;
  return relativeUploadPath(file);
};

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch (_error) {
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const formatGame = (game) => {
  const plain = game.toObject ? game.toObject({ virtuals: true }) : game;
  const id = plain._id?.toString() || plain.id;
  const developerObject = plain.developer && typeof plain.developer === "object"
    ? plain.developer
    : null;
  const developerName = plain.developerName
    || developerObject?.profile?.fullName
    || developerObject?.username
    || "";
  const releaseDate = plain.releaseDate || plain.createdAt;

  return {
    id,
    _id: id,
    title: plain.title,
    description: plain.description,
    developer: developerName,
    developerId: developerObject?._id?.toString() || plain.developer?.toString(),
    price: Number(plain.price || 0),
    category: plain.category,
    genre: plain.category,
    coverImage: plain.coverImage || "",
    image: plain.coverImage || "",
    screenshots: plain.screenshots || [],
    gameFile: plain.gameFile || "",
    averageRating: Number(plain.averageRating || 0),
    rating: Number(plain.averageRating || 0),
    totalReviews: Number(plain.totalReviews || 0),
    reviews: Number(plain.totalReviews || 0),
    totalSales: Number(plain.totalSales || 0),
    downloads: Number(plain.totalSales || 0),
    status: plain.status,
    tags: plain.tags || [],
    isFeatured: Boolean(plain.isFeatured),
    isFree: Number(plain.price || 0) === 0,
    isNew: releaseDate
      ? Date.now() - new Date(releaseDate).getTime() <= 1000 * 60 * 60 * 24 * 90
      : false,
    releaseDate: releaseDate ? new Date(releaseDate).toISOString().split("T")[0] : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const getGames = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};
    const search = req.query.search || req.query.q;
    const category = req.query.category || req.query.genre;

    if (req.query.status && ["draft", "published"].includes(req.query.status)) {
      query.status = req.query.status;
    } else {
      query.status = "published";
    }

    if (category) {
      query.category = category;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { category: regex },
        { developerName: regex },
        { tags: regex },
      ];
    }

    const sortMap = {
      featured: { isFeatured: -1, createdAt: -1 },
      rating: { averageRating: -1, totalReviews: -1 },
      newest: { releaseDate: -1, createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      popular: { totalSales: -1 },
      title: { title: 1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.featured;

    const [games, total] = await Promise.all([
      Game.find(query).populate("developer", "username profile role").sort(sort).skip(skip).limit(limit),
      Game.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        games: games.map(formatGame),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getGameById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid game id" });
    }

    const game = await Game.findById(req.params.id).populate("developer", "username profile role");
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

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

export const createGame = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    const files = req.files || {};
    const coverFile = files.coverImage?.[0] || files.image?.[0];
    const gameFile = files.gameFile?.[0];
    const screenshotFiles = files.screenshots || [];
    const category = req.body.category || req.body.genre;
    const developerName = req.user.profile?.fullName || req.user.username;

    const game = await Game.create({
      title: req.body.title,
      description: req.body.description,
      developer: req.user._id,
      developerName,
      price: Number(req.body.price),
      category,
      coverImage: coverFile ? publicUploadPath(coverFile) : req.body.coverImage || req.body.image || "",
      screenshots: [
        ...parseList(req.body.screenshots),
        ...screenshotFiles.map(publicUploadPath),
      ],
      gameFile: gameFile ? storedUploadPath(gameFile) : req.body.gameFile || "",
      status: req.body.status || "published",
      tags: parseList(req.body.tags),
      isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
      releaseDate: req.body.releaseDate || new Date(),
    });

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

export const updateGame = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid game id" });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (game.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner developer can modify this game",
      });
    }

    const files = req.files || {};
    const coverFile = files.coverImage?.[0] || files.image?.[0];
    const gameFile = files.gameFile?.[0];
    const screenshotFiles = files.screenshots || [];

    const allowedFields = ["title", "description", "status", "releaseDate"];
    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        game[field] = req.body[field];
      }
    });

    if (typeof req.body.price !== "undefined") game.price = Number(req.body.price);
    if (req.body.category || req.body.genre) game.category = req.body.category || req.body.genre;
    if (typeof req.body.tags !== "undefined") game.tags = parseList(req.body.tags);
    if (typeof req.body.isFeatured !== "undefined") {
      game.isFeatured = req.body.isFeatured === "true" || req.body.isFeatured === true;
    }
    if (coverFile) game.coverImage = publicUploadPath(coverFile);
    if (gameFile) game.gameFile = storedUploadPath(gameFile);
    if (screenshotFiles.length > 0 || typeof req.body.screenshots !== "undefined") {
      game.screenshots = [
        ...parseList(req.body.screenshots),
        ...screenshotFiles.map(publicUploadPath),
      ];
    }

    await game.save();

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

export const deleteGame = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid game id" });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    if (game.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner developer can delete this game",
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

export const downloadGame = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid game id" });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    const ownsGame = req.user.library.some((gameId) => gameId.toString() === game._id.toString());
    if (!ownsGame) {
      return res.status(403).json({
        success: false,
        message: "You must own this game to download it",
      });
    }

    if (!game.gameFile) {
      return res.status(404).json({
        success: false,
        message: "No downloadable file is available for this game",
      });
    }

    const relativePath = game.gameFile.startsWith("/") ? game.gameFile.slice(1) : game.gameFile;
    const filePath = path.resolve(relativePath);
    const uploadRoot = path.resolve("uploads");
    const pathFromUploadRoot = path.relative(uploadRoot, filePath);

    if (pathFromUploadRoot.startsWith("..") || path.isAbsolute(pathFromUploadRoot)) {
      return res.status(403).json({
        success: false,
        message: "Download path is not allowed",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Download file not found on server",
      });
    }

    return res.download(filePath, path.basename(filePath), (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
};
