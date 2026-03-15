import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: false, default: "" },
      location: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    items: [orderItemSchema],
    total: { type: Number, required: true },

    // ✅ ADD THESE FIELDS
    deliveryFee: {
      type: Number,
      required: true,
      default: 0,
    },
    deliveryDistance: {
      type: Number, // in kilometers
      default: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Preparing Food", "Ready for Delivery", "Processing", "Delivered", "Completed", "Cancelled"],
      default: "Pending",
    },
    notes: { type: String, default: "" },
    paymentMethod: {
      type: String,
      enum: ["GCash"],
      default: "GCash",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Paid",
    },
    gcashReferenceNumber: { type: String, required: false, default: "" },
    gcashProofImage: { type: String, required: false, default: "" },
    deliveryAddress: { type: String, required: true },
    driverAssigned: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    pickupTime: { type: Date, default: null },
    etaDelivery: { type: Date, default: null },
    // ✅ NEW: Add rating and feedback fields
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
      maxLength: 500,
    },
    hasRated: {
      type: Boolean,
      default: false,
    },
    ratedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
