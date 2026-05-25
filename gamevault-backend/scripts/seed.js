import dotenv from "dotenv";
import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import { mockGames, mockReviews, mockOrders } from "../../gamevault-frontend/src/data/mockData.js";
import Game from "../models/Game.js";
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
    Game.deleteMany({}),
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
      role: "developer",
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

  const demoFilePath = path.join(process.cwd(), "uploads", "games", "files", "gamevault-demo.txt");
  fs.mkdirSync(path.dirname(demoFilePath), { recursive: true });
  fs.writeFileSync(
    demoFilePath,
    "This is a NutriFactor demo receipt file for seeded supplement products.\n"
  );

  const games = await Game.create(
    mockGames.map((game, index) => ({
      title: game.title,
      description: game.description,
      developer: developer._id,
      developerName: index < 3 ? "NutriFactor Wellness Lab" : game.developer,
      price: game.price,
      category: game.genre,
      coverImage: game.image,
      screenshots: [1, 2, 3].map((n) => `/images/screenshots/${game.id}-${n}.jpg`),
      gameFile: "uploads/games/files/gamevault-demo.txt",
      averageRating: game.rating,
      totalReviews: game.reviews,
      totalSales: game.downloads,
      status: "published",
      tags: game.tags,
      isFeatured: game.isFeatured,
      releaseDate: game.releaseDate,
    }))
  );

  const gameByLegacyId = new Map(mockGames.map((game, index) => [game.id, games[index]]));

  customer.library = [1, 4, 6].map((legacyId) => gameByLegacyId.get(legacyId)._id);
  await customer.save();

  const reviewerIds = new Map([[1, customer._id.toString()]]);

  for (const review of mockReviews) {
    if (!reviewerIds.has(review.userId)) {
      const reviewer = await User.create({
        username: review.userName,
        email: `reviewer-${review.userId}@gamevault.local`,
        password: "password123",
        role: "customer",
        profile: { fullName: review.userName },
        library: gameByLegacyId.has(review.gameId) ? [gameByLegacyId.get(review.gameId)._id] : [],
      });
      reviewerIds.set(review.userId, reviewer._id.toString());
    }
  }

  await Review.create(
    mockReviews
      .filter((review) => gameByLegacyId.has(review.gameId))
      .map((review) => ({
        user: reviewerIds.get(review.userId),
        game: gameByLegacyId.get(review.gameId)._id,
        rating: review.rating,
        comment: review.text,
        createdAt: new Date(review.date),
        updatedAt: new Date(review.date),
      }))
  );

  await Order.create(
    mockOrders
      .filter((order) => gameByLegacyId.has(order.gameId))
      .map((order) => ({
        user: customer._id,
        games: [
          {
            game: gameByLegacyId.get(order.gameId)._id,
            title: order.gameName,
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
