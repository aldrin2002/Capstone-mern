import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const generateTokenAndSetCookie = async (res, userId) => {
    // Fetch user to get role
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    
    // Include both userId and role in the token
    const token = jwt.sign(
        { 
            userId, 
            role: user.role 
        }, 
        process.env.JWT_SECRET, 
        {
            expiresIn: "30d",
        }
    );

    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });
    
    return token; // Return the token so it can be included in response body
};