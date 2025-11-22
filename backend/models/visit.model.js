import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        ipAddress: {
            type: String,
            default: "unknown"
        },
        userAgent: {
            type: String,
            default: "unknown"
        },
        visitedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

// Get total visits count
visitSchema.statics.getTotalVisits = async function() {
    return await this.countDocuments();
};

export const Visit = mongoose.model("Visit", visitSchema);