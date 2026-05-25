import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { mockproducts, mockReviews, mockOrders } from "../data/mockData.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

dotenv.config();

const connect = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  await mongoose.connect(process.env.MONGO_URI);
};

const seed = async () => {
  await connect();

  await Promise.all([
    Review.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);

  const [customer, developer, admin] = await User.create([
    {
      username: "Alex Morgan",
      email: "customer@nutrifactor.local",
      password: "password123",
      role: "customer",
      profile: { fullName: "Alex Morgan" },
    },
    {
      username: "Sam Chen",
      email: "seller@nutrifactor.local",
      password: "password123",
      role: "seller",
      profile: { fullName: "NutriFactor Wellness Lab" },
    },
    {
      username: "Admin User",
      email: "admin@nutrifactor.local",
      password: "password123",
      role: "admin",
      profile: { fullName: "Admin User" },
    },
  ]);

  const demoFilePath = path.join(process.cwd(), "uploads", "products", "files", "nutrient-demo.txt");
  fs.mkdirSync(path.dirname(demoFilePath), { recursive: true });
  fs.writeFileSync(
    demoFilePath,
    "This is a NutriFactor demo receipt file for seeded supplement products.\n"
  );

  const products = await Product.create(
    mockproducts.map((product, index) => ({
      title: product.title,
      description: product.description,
      seller: developer._id,
      brandName: index < 3 ? "NutriFactor Wellness Lab" : product.developer,
      price: product.price,
      category: product.genre,
      coverImage: product.image,
      screenshots: [1, 2, 3].map((n) => `/images/screenshots/${product.id}-${n}.jpg`),
      productFile: "uploads/products/files/nutrient-demo.txt",
      averageRating: product.rating,
      totalReviews: product.reviews,
      totalSales: product.downloads,
      status: "published",
      tags: product.tags,
      isFeatured: product.isFeatured,
      releaseDate: product.releaseDate,
    }))
  );

  const productByLegacyId = new Map(mockproducts.map((product, index) => [product.id, products[index]]));

  customer.purchased = [1, 4, 6].map((legacyId) => productByLegacyId.get(legacyId)._id);
  await customer.save();

  const reviewerIds = new Map([[1, customer._id.toString()]]);

  for (const review of mockReviews) {
    if (!reviewerIds.has(review.userId)) {
      const reviewer = await User.create({
        username: review.userName,
        email: `reviewer-${review.userId}@nutrifactor.local`,
        password: "password123",
        role: "customer",
        profile: { fullName: review.userName },
        purchased: productByLegacyId.has(review.productId) ? [productByLegacyId.get(review.productId)._id] : [],
      });
      reviewerIds.set(review.userId, reviewer._id.toString());
    }
  }

  await Review.create(
    mockReviews
      .filter((review) => productByLegacyId.has(review.productId))
      .map((review) => ({
        user: reviewerIds.get(review.userId),
        product: productByLegacyId.get(review.productId)._id,
        rating: review.rating,
        comment: review.text,
        createdAt: new Date(review.date),
        updatedAt: new Date(review.date),
      }))
  );

  await Order.create(
    mockOrders
      .filter((order) => productByLegacyId.has(order.productId))
      .map((order) => ({
        user: customer._id,
        products: [
          {
            product: productByLegacyId.get(order.productId)._id,
            title: order.productName,
            price: order.price,
          },
        ],
        totalAmount: order.price,
        paymentStatus: "completed",
        paymentMethod: order.paymentMethod,
        createdAt: new Date(order.date),
        updatedAt: new Date(order.date),
      }))
  );

  console.log("Seed complete");
  console.log("Customer: customer@nutrifactor.local / password123");
  console.log("Seller: seller@nutrifactor.local / password123");
  console.log("Admin: admin@nutrifactor.local / password123");

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});

