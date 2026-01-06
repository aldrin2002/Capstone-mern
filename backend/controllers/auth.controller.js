import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { User } from "../models/user.model.js";
import { sendVerificationEmail } from "../utils/emailService.js";

// Helper: create a 6-digit code and expiry (15 minutes)
const createVerification = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    return { code, expires };
};

export const signup = async (req, res) => {
    try {
        const { email, password, name, phone, address, location } = req.body;

        if (!email || !password || !name || !phone || !address) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ success: false, message: "Cafe location coordinates are required" });
        }
        if (!/^09\d{9}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Phone number must be 11 digits starting with 09" });
        }

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const { code, expires } = createVerification();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            location: { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
            role: "admin",
            emailVerified: false,
            verificationCode: code,
            verificationExpires: expires
        });

        await user.save();
        await sendVerificationEmail(email, code);

        res.status(201).json({ success: true, message: "Verification code sent to email", email });
    } catch (error) {
        console.error("Admin signup error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: "admin" });
        if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });
        if (!user.emailVerified) return res.status(403).json({ success: false, message: "Please verify your email first." });
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = await generateTokenAndSetCookie(res, user._id);
        await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

        res.status(200).json({ success: true, message: "Logged in successfully", token, user: { ...user._doc, password: undefined } });
    } catch (error) {
        console.log("Error in login ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const costumerlogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: "customer" });
        if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });
        if (!user.emailVerified) return res.status(403).json({ success: false, message: "Please verify your email first." });
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = await generateTokenAndSetCookie(res, user._id);
        await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

        res.status(200).json({ success: true, message: "Logged in successfully", token, user: { ...user._doc, password: undefined } });
    } catch (error) {
        console.log("Error in costumerlogin ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const costumerSignup = async (req, res) => {
    const { email, password, name, phone, address, location } = req.body;
    try {
        if (!email || !password || !name || !phone || !address) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }
        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ success: false, message: "Location coordinates are required. Please select your address from the suggestions." });
        }
        if (!/^09\d{9}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Phone number must be 11 digits starting with 09" });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const { code, expires } = createVerification();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            phone,
            address,
            location: { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
            role: "customer",
            emailVerified: false,
            verificationCode: code,
            verificationExpires: expires
        });
        await user.save();
        await sendVerificationEmail(email, code);

        res.status(201).json({ success: true, message: "Verification code sent to email", email });
    } catch (error) {
        console.error("Customer signup error:", error);
        res.status(500).json({ success: false, message: "Error creating customer account" });
    }
};

export const driverSignup = async (req, res) => {
  try {
    const { email, password, name, phone, address, location } = req.body;

    if (!email || !password || !name || !phone || !address) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ success: false, message: "Location coordinates are required. Please select your address from the suggestions." });
    }
    if (!/^09\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Phone number must be 11 digits starting with 09" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "User already exists" });

    const hashed = await bcryptjs.hash(password, 10);
    const { code, expires } = createVerification();

    const user = new User({
      email,
      password: hashed,
      name,
      phone,
      address,
      location: { lat: parseFloat(location.lat), lng: parseFloat(location.lng) },
      role: "driver",
      emailVerified: false,
      verificationCode: code,
      verificationExpires: expires
    });

    await user.save();
    await sendVerificationEmail(email, code);

    return res.status(201).json({ success: true, message: "Verification code sent", email });
  } catch (e) {
    console.error("Driver signup error:", e);
    return res.status(500).json({ success: false, message: "Error creating driver account" });
  }
};

export const driverLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "driver" });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });
    if (!user.emailVerified) return res.status(403).json({ success: false, message: "Please verify your email first." });

    const ok = await bcryptjs.compare(password, user.password);
    if (!ok) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = await generateTokenAndSetCookie(res, user._id);
    await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      token,
      user: { ...user._doc, password: undefined }
    });
  } catch (e) {
    console.error("Driver login error:", e);
    return res.status(400).json({ success: false, message: e.message });
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

// Verify email with code
export const verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.emailVerified) return res.status(400).json({ success: false, message: "Email already verified" });
        if (!user.verificationCode || !user.verificationExpires) {
            return res.status(400).json({ success: false, message: "No active verification code" });
        }
        if (new Date() > new Date(user.verificationExpires)) {
            return res.status(400).json({ success: false, message: "Verification code has expired" });
        }
        if (user.verificationCode !== code) {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }
        user.emailVerified = true;
        user.verificationCode = null;
        user.verificationExpires = null;
        await user.save();
        return res.status(200).json({ success: true, message: "Email verified successfully" });
    } catch (err) {
        console.error("verifyEmail error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Resend verification code
export const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        if (user.emailVerified) return res.status(400).json({ success: false, message: "Email already verified" });
        const { code, expires } = createVerification();
        user.verificationCode = code;
        user.verificationExpires = expires;
        await user.save();
        await sendVerificationEmail(email, code);
        return res.status(200).json({ success: true, message: "Verification code resent" });
    } catch (err) {
        console.error("resendVerificationCode error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};