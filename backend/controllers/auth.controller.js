import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken'; // Add this import
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { User } from "../models/user.model.js";
import { jwtDecode } from "jwt-decode";

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
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
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

// Add this function to your auth controller
export const googleLogin = async (req, res) => {
  try {
    console.log("Google login request received");
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: "No credential provided" 
      });
    }
    
    console.log("Decoding credential...");
    // Decode the JWT token from Google
    const decoded = jwtDecode(credential);
    console.log("Decoded credential:", { email: decoded.email, name: decoded.name });
    
    // Extract user info from decoded token
    const { email, name, sub, picture } = decoded;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      console.log("Creating new user from Google login");
      // Create new user if they don't exist
      user = new User({
        email,
        name,
        googleId: sub,
        profilePicture: picture,
        role: "customer",
        // Generate a random secure password for Google users
        password: await bcryptjs.hash(Math.random().toString(36).slice(-10), 10)
      });
      
      await user.save();
    } else {
      console.log("User found:", user.email);
      // Update googleId if not already set
      if (!user.googleId) {
        user.googleId = sub;
        await user.save();
      }
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    try {
      // Generate token directly to avoid issues with the helper function
      const token = jwt.sign(
        { 
          userId: user._id,
          role: user.role   // Include user role in the token
        },
        process.env.JWT_SECRET || "fallback-secret-key-for-development",
        { expiresIn: '30d' }
      );
      
      // Set cookie
      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "strict",
      });
      
      res.status(200).json({
        success: true,
        message: "Google login successful",
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture
        }
      });
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      res.status(500).json({
        success: false,
        message: "Error generating authentication token"
      });
    }
    
  } catch (error) {
    console.error("Google login error details:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error processing Google login: " + error.message
    });
  }
};