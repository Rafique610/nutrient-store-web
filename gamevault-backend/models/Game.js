import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Game title is required"],
      trim: true,
      maxlength: [120, "Game title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Game description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    developerName: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Game category is required"],
      trim: true,
      maxlength: [60, "Category cannot exceed 60 characters"],
    },
    coverImage: {
      type: String,
      default: "",
    },
    screenshots: {
      type: [String],
      default: [],
    },
    gameFile: {
      type: String,
      default: "",
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalReviews: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalSales: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    tags: {
      type: [String],
      default: [],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    releaseDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

gameSchema.index({
  title: "text",
  description: "text",
  category: "text",
  developerName: "text",
  tags: "text",
});

const Game = mongoose.model("Game", gameSchema);

export default Game;
