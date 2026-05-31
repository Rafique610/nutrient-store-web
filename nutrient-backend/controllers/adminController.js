import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { formatProduct } from "./productController.js";
import { formatUser } from "./authController.js";

const normalizeProductStatus = (value) => {
  if (!value) return null;
  const status = String(value).trim().toLowerCase();
  if (status === "published") return "active";
  if (status === "active" || status === "draft") return status;
  return null;
};

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const parsePercent = (value) => {
  const percent = Number(value);
  if (!Number.isFinite(percent)) return null;
  if (percent <= 0 || percent >= 100) return null;
  return percent;
};

const formatAdminOrder = (order) => {
  const plain = order.toObject ? order.toObject() : order;
  const user = plain.user && typeof plain.user === "object" ? plain.user : null;

  return {
    id: plain._id.toString(),
    _id: plain._id.toString(),
    user: user
      ? {
          id: user._id?.toString() || user.id,
          name: user.profile?.fullName || user.username || "",
          email: user.email || "",
        }
      : plain.user?.toString(),
    products: plain.products || [],
    totalAmount: plain.totalAmount,
    paymentStatus: plain.paymentStatus,
    paymentMethod: plain.paymentMethod,
    fulfillmentStatus: plain.fulfillmentStatus,
    shippingAddress: plain.shippingAddress || null,
    customerNotes: plain.customerNotes || "",
    timeline: plain.timeline || [],
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role && ["customer", "admin"].includes(req.query.role)) {
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

export const getAdminproducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate("seller", "username profile role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        products: products.map(formatProduct),
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
      totalProducts,
      totalOrders,
      activeProducts,
      pendingApprovals,
      totalCustomers,
      pendingOrders,
      lowStockCount,
      revenue,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ status: { $in: ["active", "published"] } }),
      Product.countDocuments({ status: "draft" }),
      User.countDocuments({ role: "customer" }),
      Order.countDocuments({ fulfillmentStatus: { $in: ["new", "processing"] } }),
      Product.countDocuments({
        inStock: true,
        $expr: { $lte: ["$stock", "$lowStockThreshold"] },
      }),
      Order.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalproducts: totalProducts,
        totalOrders,
        totalRevenue: revenue[0]?.totalRevenue || 0,
        activeproducts: activeProducts,
        pendingApprovals,
        totalCustomers,
        pendingOrders,
        lowStockCount,
        totalDevelopers: 0,
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

    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be customer or admin",
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
    if (req.body.role && ["customer", "admin"].includes(req.body.role)) {
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
      Product.updateMany({ seller: user._id }, { status: "draft" }),
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

export const createAdminproduct = async (req, res, next) => {
  try {
    const { title, description, price } = req.body;
    const category = req.body.category || req.body.genre;

    if (!title || !description || typeof price === "undefined" || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, price, and category are required",
      });
    }

    const status = normalizeProductStatus(req.body.status) || (req.body.status === "published" ? "published" : "active");
    const compareAtPrice = typeof req.body.compareAtPrice === "undefined" || req.body.compareAtPrice === ""
      ? null
      : Number(req.body.compareAtPrice);

    const product = await Product.create({
      title,
      description,
      seller: req.user._id,
      brandName: req.body.brandName || req.body.developer || req.user.profile?.fullName || req.user.username,
      price: Number(price),
      compareAtPrice,
      category,
      coverImage: req.body.coverImage || req.body.image || "",
      screenshots: parseList(req.body.screenshots),
      productFile: req.body.productFile || "",
      status,
      inStock: typeof req.body.inStock === "undefined" ? true : Boolean(req.body.inStock),
      stock: typeof req.body.stock === "undefined" || req.body.stock === "" ? 0 : Number(req.body.stock),
      lowStockThreshold: typeof req.body.lowStockThreshold === "undefined" || req.body.lowStockThreshold === "" ? 5 : Number(req.body.lowStockThreshold),
      tags: parseList(req.body.tags || category),
      isFeatured: Boolean(req.body.isFeatured),
      releaseDate: req.body.releaseDate || new Date(),
    });

    await product.populate("seller", "username profile role");

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

export const updateAdminproduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    ["title", "description", "coverImage", "productFile", "releaseDate"].forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        if (field === "productFile") product.productFile = req.body[field];
        else product[field] = req.body[field];
      }
    });

    if (typeof req.body.price !== "undefined") product.price = Number(req.body.price);
    if (typeof req.body.compareAtPrice !== "undefined") {
      product.compareAtPrice = req.body.compareAtPrice === "" || req.body.compareAtPrice === null
        ? null
        : Number(req.body.compareAtPrice);
    }
    if (typeof req.body.status !== "undefined") {
      const status = normalizeProductStatus(req.body.status) || (req.body.status === "published" ? "published" : null);
      if (status) product.status = status;
    }
    if (req.body.category || req.body.genre) product.category = req.body.category || req.body.genre;
    if (req.body.brandName || req.body.developer) product.brandName = req.body.brandName || req.body.developer;
    if (typeof req.body.tags !== "undefined") product.tags = parseList(req.body.tags);
    if (typeof req.body.screenshots !== "undefined") product.screenshots = parseList(req.body.screenshots);
    if (typeof req.body.isFeatured !== "undefined") product.isFeatured = Boolean(req.body.isFeatured);
    if (typeof req.body.inStock !== "undefined") product.inStock = Boolean(req.body.inStock);
    if (typeof req.body.stock !== "undefined") product.stock = Number(req.body.stock);
    if (typeof req.body.lowStockThreshold !== "undefined") product.lowStockThreshold = Number(req.body.lowStockThreshold);

    await product.save();
    await product.populate("seller", "username profile role");

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

export const deleteAdminproduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
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

export const getAdminOrders = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const query = {};

    if (req.query.fulfillmentStatus && ["new", "processing", "shipped", "delivered", "cancelled"].includes(req.query.fulfillmentStatus)) {
      query.fulfillmentStatus = req.query.fulfillmentStatus;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      query.createdAt = {};
      if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
    }

    if (req.query.search) {
      const raw = String(req.query.search).trim();
      const regex = new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const userMatches = await User.find({
        $or: [{ username: regex }, { email: regex }, { "profile.fullName": regex }],
      }).select("_id");
      const userIds = userMatches.map((u) => u._id);

      const or = [];
      if (mongoose.Types.ObjectId.isValid(raw)) or.push({ _id: raw });
      if (userIds.length > 0) or.push({ user: { $in: userIds } });
      if (or.length > 0) query.$or = or;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "username email profile.fullName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        orders: orders.map(formatAdminOrder),
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

export const getAdminOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "username email profile.fullName")
      .populate("products.product", "title category coverImage");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        order: formatAdminOrder(order),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminOrderFulfillmentStatus = async (req, res, next) => {
  try {
    const { fulfillmentStatus } = req.body;
    if (!["new", "processing", "shipped", "delivered", "cancelled"].includes(fulfillmentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid fulfillmentStatus" });
    }

    const order = await Order.findById(req.params.id).populate("user", "username email profile.fullName");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const from = order.fulfillmentStatus || "new";
    order.fulfillmentStatus = fulfillmentStatus;

    const actorName = req.user.profile?.fullName || req.user.username || "Admin";
    order.timeline.push({
      type: "status_changed",
      message: `Status: ${from} → ${fulfillmentStatus}`,
      meta: { from, to: fulfillmentStatus },
      actor: { id: req.user._id, name: actorName },
    });

    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        order: formatAdminOrder(order),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const addAdminOrderNote = async (req, res, next) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message) {
      return res.status(400).json({ success: false, message: "Note message is required" });
    }

    const order = await Order.findById(req.params.id).populate("user", "username email profile.fullName");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const actorName = req.user.profile?.fullName || req.user.username || "Admin";
    order.timeline.push({
      type: "note",
      message,
      actor: { id: req.user._id, name: actorName },
    });

    await order.save();

    return res.status(200).json({
      success: true,
      data: {
        order: formatAdminOrder(order),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const previewBulkSale = async (req, res, next) => {
  try {
    const percent = parsePercent(req.body.percent);
    if (!percent) {
      return res.status(400).json({ success: false, message: "percent must be a number between 0 and 100" });
    }

    const affectedCount = await Product.countDocuments({
      status: { $in: ["active", "published"] },
      price: { $gt: 0 },
    });

    return res.status(200).json({
      success: true,
      data: { affectedCount },
    });
  } catch (error) {
    return next(error);
  }
};

export const applyBulkSale = async (req, res, next) => {
  try {
    const percent = parsePercent(req.body.percent);
    if (!percent) {
      return res.status(400).json({ success: false, message: "percent must be a number between 0 and 100" });
    }

    const products = await Product.find({
      status: { $in: ["active", "published"] },
      price: { $gt: 0 },
    }).select("_id price compareAtPrice");

    const ops = products.map((p) => {
      const base = typeof p.compareAtPrice === "number" && p.compareAtPrice > 0 ? p.compareAtPrice : p.price;
      const compareAtPrice = typeof p.compareAtPrice === "number" && p.compareAtPrice > 0 ? p.compareAtPrice : p.price;
      const newPrice = round2(base * (1 - percent / 100));
      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              compareAtPrice,
              price: newPrice < 0 ? 0 : newPrice,
            },
          },
        },
      };
    });

    if (ops.length > 0) {
      await Product.bulkWrite(ops, { ordered: false });
    }

    return res.status(200).json({
      success: true,
      data: { affectedCount: ops.length },
    });
  } catch (error) {
    return next(error);
  }
};

export const removeBulkSale = async (req, res, next) => {
  try {
    const products = await Product.find({
      compareAtPrice: { $type: "number" },
    }).select("_id compareAtPrice");

    const ops = products
      .filter((p) => typeof p.compareAtPrice === "number" && p.compareAtPrice > 0)
      .map((p) => ({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: { price: round2(p.compareAtPrice) },
            $unset: { compareAtPrice: "" },
          },
        },
      }));

    if (ops.length > 0) {
      await Product.bulkWrite(ops, { ordered: false });
    }

    return res.status(200).json({
      success: true,
      data: { affectedCount: ops.length },
    });
  } catch (error) {
    return next(error);
  }
};

