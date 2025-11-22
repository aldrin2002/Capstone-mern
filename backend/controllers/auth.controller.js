import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { User } from "../models/user.model.js";

export const signup = async (req, res) => {
    try {
        const { email, password, name, phone, address, location } = req.body; // ✅ Add location

        if (!email || !password || !name || !phone || !address) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        // ✅ Validate location coordinates
        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ 
                success: false, 
                message: "Cafe location coordinates are required" 
            });
        }

        if (!/^09\d{9}$/.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: "Phone number must be 11 digits starting with 09" 
            });
        }

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        
        // ✅ Create admin with location
        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            location: {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lng)
            },
            role: "admin",
        });

        await user.save();
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
        console.error("Admin signup error:", error);
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

        const token = await generateTokenAndSetCookie(res, user._id);

        // Update lastLogin without triggering validation
        await User.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token: token,
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

        const token = await generateTokenAndSetCookie(res, user._id);

        // Update lastLogin without triggering validation
        await User.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token: token,
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

export const costumerSignup = async (req, res) => {
    // ✅ ADD location to destructuring
    const { email, password, name, phone, address, location } = req.body;

    try {
        // Validate all fields are present
        if (!email || !password || !name || !phone || !address) {
            return res.status(400).json({ 
                success: false, 
                message: "All fields are required" 
            });
        }

        // ✅ ADD THIS - Validate location coordinates
        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ 
                success: false, 
                message: "Location coordinates are required. Please select your address from the suggestions." 
            });
        }

        // Validate phone format (11 digits starting with 09)
        if (!/^09\d{9}$/.test(phone)) {
            return res.status(400).json({ 
                success: false, 
                message: "Phone number must be 11 digits starting with 09" 
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: "User already exists" 
            });
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);

        // ✅ MODIFY THIS - Create new user with location
        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            location: {  // ✅ ADD THIS
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lng)
            },
            role: "customer"
        });

        await user.save();

        // Generate JWT token
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
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
            path: "/"
        });
        
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