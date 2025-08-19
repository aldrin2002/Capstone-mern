import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, 'Product reference is required']
        },
        name: {
            type: String,
            required: [true, 'Product name is required']
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price must be non-negative']
        }
    },
    { _id: true }
);

const orderSchema = new mongoose.Schema(
    {
        customer: {
            name: {
                type: String,
                required: [true, 'Customer name is required'],
                trim: true
            },
            email: {
                type: String,
                required: [true, 'Customer email is required'],
                trim: true,
                lowercase: true
            },
            phone: {
                type: String,
                default: "",
                trim: true
            }
        },
        items: {
            type: [orderItemSchema],
            required: [true, 'Order items are required'],
            validate: {
                validator: function(items) {
                    return items && items.length > 0;
                },
                message: 'Order must contain at least one item'
            }
        },
        total: {
            type: Number,
            required: [true, 'Order total is required'],
            min: [0, 'Total must be non-negative']
        },
        status: {
            type: String,
            enum: {
                values: ["Pending", "Processing", "Completed", "Cancelled"],
                message: 'Status must be one of: Pending, Processing, Completed, Cancelled'
            },
            default: "Pending"
        },
        paymentMethod: {
            type: String,
            enum: {
                values: ["Cash on Delivery", "GCash"],
                message: 'Payment method must be either Cash on Delivery or GCash'
            },
            default: "Cash on Delivery"
        },
        paymentStatus: {
            type: String,
            enum: {
                values: ["Pending", "Paid", "Failed"],
                message: 'Payment status must be one of: Pending, Paid, Failed'
            },
            default: "Pending"
        },
        deliveryAddress: {
            type: String,
            default: "",
            trim: true
        },
        notes: {
            type: String,
            default: "",
            trim: true
        },
        gcashReference: {
            type: String,
            default: "",
            trim: true
        },
        proofOfPayment: {
            type: String,
            default: "",
            trim: true
        }
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Add indexes for better performance
orderSchema.index({ "customer.email": 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model("Order", orderSchema);