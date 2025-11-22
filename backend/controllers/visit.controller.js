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
        
        // ✅ FIX: Create session ID using IP + UserAgent + DATE ONLY
        // This ensures same user on same day = same session
        const today = new Date().toISOString().split('T')[0]; // "2024-12-28"
        const sessionString = `${ipAddress}-${userAgent}-${today}`;
        const sessionId = crypto
            .createHash("sha256")
            .update(sessionString)
            .digest("hex");

        console.log("📊 Visit attempt:", {
            ip: ipAddress.substring(0, 15),
            date: today,
            sessionId: sessionId.substring(0, 10)
        });

        // ✅ FIX: Check if this session already exists TODAY
        const existingVisit = await Visit.findOne({ sessionId });

        if (existingVisit) {
            // Already counted today - just return current count
            const totalVisits = await Visit.getTotalVisits();
            
            console.log("⏭️ Session already counted today. Total:", totalVisits);
            
            return res.status(200).json({
                success: true,
                message: "Visit already counted today",
                totalVisits,
                isNewVisit: false
            });
        }

        // ✅ NEW VISIT - Record it
        const newVisit = new Visit({
            sessionId,
            ipAddress,
            userAgent,
            visitedAt: new Date()
        });

        await newVisit.save();

        const totalVisits = await Visit.getTotalVisits();

        console.log("🎉 New visit recorded! Total:", totalVisits);

        res.status(201).json({
            success: true,
            message: "Visit recorded",
            totalVisits,
            isNewVisit: true
        });
    } catch (error) {
        console.error("❌ Error recording visit:", error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            const totalVisits = await Visit.getTotalVisits();
            return res.status(200).json({
                success: true,
                message: "Visit already counted",
                totalVisits,
                isNewVisit: false
            });
        }
        
        res.status(500).json({
            success: false,
            message: "Failed to record visit"
        });
    }
};

// Get visit count (unchanged)
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