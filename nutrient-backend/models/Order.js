import mongoose from "mongoose";

const orderTimelineSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["created", "status_changed", "note"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    actor: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      name: {
        type: String,
        default: "",
        trim: true,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    paymentMethod: {
      type: String,
      default: "mock",
      trim: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ["new", "processing", "shipped", "delivered", "cancelled"],
      default: "new",
    },
    shippingAddress: {
      fullName: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      addressLine1: { type: String, default: "", trim: true },
      addressLine2: { type: String, default: "", trim: true },
      city: { type: String, default: "", trim: true },
      state: { type: String, default: "", trim: true },
      postalCode: { type: String, default: "", trim: true },
      country: { type: String, default: "", trim: true },
    },
    customerNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    timeline: {
      type: [orderTimelineSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
