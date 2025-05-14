import express from "express";
import {
    login,
    logout,
    signup,
    checkAuth,
    costumerlogin,
    costumerSignup,
    googleLogin,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/costumerSignup", costumerSignup);
router.post("/costumerLogin", costumerlogin);
// Add this to your existing routes
router.post("/google-login", googleLogin);

export default router;