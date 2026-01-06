import express from "express";
import {
    login,
    logout,
    signup,
    checkAuth,
    costumerlogin,
    costumerSignup,
    verifyEmail,
    resendVerificationCode,
    driverSignup,
    driverLogin
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/costumerSignup", costumerSignup);
router.post("/costumerLogin", costumerlogin);
router.post("/driverSignup", driverSignup);
router.post("/driverLogin", driverLogin);
// Email verification endpoints
router.post("/verify-email", verifyEmail);
router.post("/resend-code", resendVerificationCode);
// Remove this line
// router.post("/google-login", googleLogin);

export default router;