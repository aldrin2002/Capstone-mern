import mongoose from "mongoose";

const deliverySettingsSchema = new mongoose.Schema(
  {
    baseRate: {
      type: Number,
      default: 30,
      required: true
    },
    perKmRate: {
      type: Number,
      default: 10,
      required: true
    },
    freeDeliveryThreshold: {
      type: Number,
      default: 500, // Free delivery for orders above ₱500
      required: true
    },
    maxDeliveryDistance: {
      type: Number,
      default: 20, // Maximum delivery distance in km
      required: true
    }
  },
  { timestamps: true }
);

export const DeliverySettings = mongoose.model("DeliverySettings", deliverySettingsSchema);