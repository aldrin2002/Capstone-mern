import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    },
    { _id: true }
);

const orderSchema = new mongoose.Schema(
    {
        customer: {
            name: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                default: ""
            }
        },
        items: [orderItemSchema],
        total: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["Pending", "Processing", "Completed", "Cancelled"],
            default: "Pending"
        },
        notes: {
            type: String,
            default: ""
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "Credit Card", "Debit Card", "Online Payment"],
            default: "Cash"
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        }
    },
    { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema); 