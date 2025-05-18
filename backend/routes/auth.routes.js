import express from "express";
import {
    login,
    logout,
    signup,
    checkAuth,
    costumerlogin,
    costumerSignup,
    // Remove googleLogin from imports
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/costumerSignup", costumerSignup);
router.post("/costumerLogin", costumerlogin);
// Remove this line
// router.post("/google-login", googleLogin);

export default router;