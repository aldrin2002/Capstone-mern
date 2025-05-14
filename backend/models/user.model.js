import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: function() {
                // Only require password if there's no googleId
                return !this.googleId;
            },
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: function() {
                // Only require phone if there's no googleId
                return !this.googleId;
            },
        },
        role: {
            type: String,
            enum: ["admin", "customer"],
            default: "customer"
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        googleId: {
            type: String,
            sparse: true
        },
        profilePicture: {
            type: String
        }
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);