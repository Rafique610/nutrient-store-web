import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "1h",
    }
  );
};

export const formatUser = (user) => {
  const plain = user.toObject ? user.toObject({ virtuals: true }) : user;
  const id = plain._id?.toString() || plain.id;
  const fullName = plain.profile?.fullName || plain.username;

  return {
    id,
    _id: id,
    username: plain.username,
    name: fullName,
    email: plain.email,
    role: plain.role,
    profile: {
      fullName,
      avatar: plain.profile?.avatar || "",
      bio: plain.profile?.bio || "",
    },
    avatar: plain.profile?.avatar || null,
    bio: plain.profile?.bio || "",
    joinDate: plain.createdAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

const sendAuthResponse = (res, statusCode, user) => {
  const token = generateToken(user);

  return res.status(statusCode).json({
    success: true,
    data: {
      token,
      user: formatUser(user),
    },
  });
};

const validationMessage = (req) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return null;
  return errors.array().map((error) => error.msg).join(", ");
};

export const registerUser = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    const { email, password } = req.body;
    const requestedName = req.body.username || req.body.name || req.body.fullName;
    const normalizedEmail = email.toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const userCount = await User.countDocuments();
    let role = "customer";

    if (req.body.role === "admin" && userCount === 0) {
      role = "admin";
    }

    const user = await User.create({
      username: requestedName,
      email: normalizedEmail,
      password,
      role,
      profile: {
        fullName: requestedName,
        avatar: req.body.avatar || "",
        bio: req.body.bio || "",
      },
    });

    return sendAuthResponse(res, 201, user);
  } catch (error) {
    return next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const message = validationMessage(req);
    if (message) {
      return res.status(400).json({ success: false, message });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return sendAuthResponse(res, 200, user);
  } catch (error) {
    return next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: formatUser(req.user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const nextName = req.body.username || req.body.name || req.body.fullName;
    if (nextName) {
      user.username = nextName;
      user.profile.fullName = nextName;
    }

    if (typeof req.body.avatar === "string") user.profile.avatar = req.body.avatar;
    if (typeof req.body.bio === "string") user.profile.bio = req.body.bio;

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
