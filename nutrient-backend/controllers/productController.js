import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { validationResult } from "express-validator";
import Product from "../models/Product.js";
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

export const formatProduct = (product) => {
  const plain = product.toObject ? product.toObject({ virtuals: true }) : product;
  const id = plain._id?.toString() || plain.id;
  const sellerObject = plain.seller && typeof plain.seller === "object"
    ? plain.seller
    : null;
  const brandName = plain.brandName
    || sellerObject?.profile?.fullName
    || sellerObject?.username
    || "";
  const releaseDate = plain.releaseDate || plain.createdAt;

  return {
    id,
    _id: id,
    title: plain.title,
    description: plain.description,
    developer: brandName,
    developerId: sellerObject?._id?.toString() || plain.seller?.toString(),
    price: Number(plain.price || 0),
    category: plain.category,
    genre: plain.category,
    coverImage: plain.coverImage || "",
    image: plain.coverImage || "",
    screenshots: plain.screenshots || [],
    productFile: plain.productFile || "",
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

export const getProducts = async (req, res, next) => {
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
        { brandName: regex },
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

    const [products, total] = await Promise.all([
      Product.find(query).populate("seller", "username profile role").sort(sort).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        products: products.map(formatProduct),
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

export const getProductById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id).populate("seller", "username profile role");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        product: formatProduct(product),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    const files = req.files || {};
    const coverFile = files.coverImage?.[0] || files.image?.[0];
    const productFile = files.productFile?.[0] || files.productFile?.[0];
    const screenshotFiles = files.screenshots || [];
    const category = req.body.category || req.body.genre;
    const brandName = req.user.profile?.fullName || req.user.username;

    const product = await Product.create({
      title: req.body.title,
      description: req.body.description,
      seller: req.user._id,
      brandName,
      price: Number(req.body.price),
      category,
      coverImage: coverFile ? publicUploadPath(coverFile) : req.body.coverImage || req.body.image || "",
      screenshots: [
        ...parseList(req.body.screenshots),
        ...screenshotFiles.map(publicUploadPath),
      ],
      productFile: productFile ? storedUploadPath(productFile) : req.body.productFile || req.body.productFile || "",
      status: req.body.status || "published",
      tags: parseList(req.body.tags),
      isFeatured: req.body.isFeatured === "true" || req.body.isFeatured === true,
      releaseDate: req.body.releaseDate || new Date(),
    });

    return res.status(201).json({
      success: true,
      data: {
        product: formatProduct(product),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner seller can modify this product",
      });
    }

    const files = req.files || {};
    const coverFile = files.coverImage?.[0] || files.image?.[0];
    const productFile = files.productFile?.[0] || files.productFile?.[0];
    const screenshotFiles = files.screenshots || [];

    const allowedFields = ["title", "description", "status", "releaseDate"];
    allowedFields.forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        product[field] = req.body[field];
      }
    });

    if (typeof req.body.price !== "undefined") product.price = Number(req.body.price);
    if (req.body.category || req.body.genre) product.category = req.body.category || req.body.genre;
    if (typeof req.body.tags !== "undefined") product.tags = parseList(req.body.tags);
    if (typeof req.body.isFeatured !== "undefined") {
      product.isFeatured = req.body.isFeatured === "true" || req.body.isFeatured === true;
    }
    if (coverFile) product.coverImage = publicUploadPath(coverFile);
    if (productFile) product.productFile = storedUploadPath(productFile);
    if (screenshotFiles.length > 0 || typeof req.body.screenshots !== "undefined") {
      product.screenshots = [
        ...parseList(req.body.screenshots),
        ...screenshotFiles.map(publicUploadPath),
      ];
    }

    await product.save();

    return res.status(200).json({
      success: true,
      data: {
        product: formatProduct(product),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the owner seller can delete this product",
      });
    }

    await Promise.all([
      Review.deleteMany({ product: product._id }),
      User.updateMany({}, { $pull: { cart: product._id, purchased: product._id } }),
      Product.findByIdAndDelete(product._id),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        id: req.params.id,
        message: "Product deleted successfully",
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const downloadProduct = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid product id" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const ownsProduct = req.user.purchased.some((productId) => productId.toString() === product._id.toString());
    if (!ownsProduct) {
      return res.status(403).json({
        success: false,
        message: "You must purchase this product to download its attachment",
      });
    }

    if (!product.productFile) {
      return res.status(404).json({
        success: false,
        message: "No downloadable file is available for this product",
      });
    }

    const relativePath = product.productFile.startsWith("/") ? product.productFile.slice(1) : product.productFile;
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

