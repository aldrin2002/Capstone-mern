import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken'; // Add this import
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { User } from "../models/user.model.js";

export const signup = async (req, res) => {
    try {
        const { email, password, name, phone } = req.body;

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            role: "admin",
        });

        await user.save();

        // jwt - now await the async function
        await generateTokenAndSetCookie(res, user._id);

        res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: "admin" });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token and return it in the response - now await the async function
        const token = await generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token: token, // Include token in response body
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in login ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const costumerlogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: "customer" }); 
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token and set cookie - now await the async function
        const token = await generateTokenAndSetCookie(res, user._id);

        user.lastLogin = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token: token, // Include token in response body
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in costumerlogin ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const costumersignup = async (req, res) => {
    const { email, password, name, phone } = req.body;
    try {
        if (!email || !password || !name || !phone) {
            throw new Error("All fields are required");
        }
        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            role: "customer"
        });

        await user.save();
        // now await the async function
        await generateTokenAndSetCookie(res, user._id);

        res.status(201).json({
            success: true,
            message: "Customer account created successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in costumersignup ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const costumerSignup = async (req, res) => {
    const { email, password, name, phone } = req.body;

    try {
        if (!email || !password || !name || !phone) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: "User already exists" 
            });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            role: "customer"
        });

        await user.save();

        // Generate JWT token - now await the async function
        await generateTokenAndSetCookie(res, user._id);

        res.status(201).json({
            success: true,
            message: "Customer account created successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        console.error("Customer signup error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error creating customer account" 
        });
    }
};

export const logout = async (req, res) => {
    try {
        // Clear the token cookie with all possible configurations
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            path: "/"
        });
        
        // Also try clearing with different path configurations
        res.clearCookie("token");
        
        res.status(200).json({ 
            success: true, 
            message: "Logged out successfully" 
        });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error logging out" 
        });
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.log("Error in checkAuth ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};