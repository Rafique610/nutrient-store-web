import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import { formatProduct } from "./productController.js";
import { formatUser } from "./authController.js";

export const getAdminUsers = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.role && ["customer", "seller", "admin"].includes(req.query.role)) {
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
      totalSellers,
      revenue,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ status: "published" }),
      Product.countDocuments({ status: "draft" }),
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "seller" }),
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
        totalDevelopers: totalSellers,
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

    if (!["customer", "seller", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be customer, seller, or admin",
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
    if (req.body.role && ["customer", "seller", "admin"].includes(req.body.role)) {
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
    const sellerUser = req.body.developerId
      ? await User.findById(req.body.developerId)
      : req.user;

    if (!title || !description || typeof price === "undefined" || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, price, and category are required",
      });
    }

    if (!sellerUser) {
      return res.status(404).json({
        success: false,
        message: "Seller user not found",
      });
    }

    const product = await Product.create({
      title,
      description,
      seller: sellerUser._id,
      brandName: req.body.developer || sellerUser.profile?.fullName || sellerUser.username,
      price: Number(price),
      category,
      coverImage: req.body.coverImage || req.body.image || "",
      screenshots: parseList(req.body.screenshots),
      productFile: req.body.productFile || "",
      status: req.body.status || "published",
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

    ["title", "description", "status", "coverImage", "productFile", "releaseDate"].forEach((field) => {
      if (typeof req.body[field] !== "undefined") {
        if (field === "productFile") product.productFile = req.body[field];
        else product[field] = req.body[field];
      }
    });

    if (typeof req.body.price !== "undefined") product.price = Number(req.body.price);
    if (req.body.category || req.body.genre) product.category = req.body.category || req.body.genre;
    if (req.body.developer) product.brandName = req.body.developer;
    if (typeof req.body.tags !== "undefined") product.tags = parseList(req.body.tags);
    if (typeof req.body.screenshots !== "undefined") product.screenshots = parseList(req.body.screenshots);
    if (typeof req.body.isFeatured !== "undefined") product.isFeatured = Boolean(req.body.isFeatured);

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

