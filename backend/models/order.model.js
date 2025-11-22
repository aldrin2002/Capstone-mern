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
      phone: { type: String, required: true },
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
      enum: ["Pending", "Processing", "Delivered", "Completed", "Cancelled"],
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
    gcashReferenceNumber: { type: String, required: true },
    gcashProofImage: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
