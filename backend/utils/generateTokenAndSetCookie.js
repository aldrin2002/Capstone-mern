import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });

    res.cookie("token", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });
    
    return token; // Return the token so it can be included in response body
};