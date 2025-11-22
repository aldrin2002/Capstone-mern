import { Visit } from "../models/visit.model.js";
import crypto from "crypto";

// Record a new visit
export const recordVisit = async (req, res) => {
    try {
        const ipAddress = 
            req.headers['x-forwarded-for']?.split(',')[0] || 
            req.headers['x-real-ip'] || 
            req.connection.remoteAddress || 
            "unknown";
        
        const userAgent = req.headers["user-agent"] || "unknown";
        
        // Create session ID (IP + UserAgent + timestamp for liberal counting)
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const sessionString = `${ipAddress}-${userAgent}-${timestamp}-${randomStr}`;
        const sessionId = crypto
            .createHash("sha256")
            .update(sessionString)
            .digest("hex");

        // Record new visit
        const newVisit = new Visit({
            sessionId,
            ipAddress,
            userAgent
        });

        await newVisit.save();

        const totalVisits = await Visit.getTotalVisits();

        res.status(201).json({
            success: true,
            totalVisits
        });
    } catch (error) {
        console.error("❌ Error recording visit:", error);
        res.status(500).json({
            success: false,
            message: "Failed to record visit"
        });
    }
};

// Get visit count
export const getVisitCount = async (req, res) => {
    try {
        const totalVisits = await Visit.getTotalVisits();
        
        res.status(200).json({
            success: true,
            totalVisits
        });
    } catch (error) {
        console.error("❌ Error getting visit count:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get visit count"
        });
    }
};