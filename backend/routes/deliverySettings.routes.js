import express from "express";
import { 
  getDeliverySettings, 
  updateDeliverySettings,
  calculateDeliveryFee 
} from "../controllers/deliverySettings.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

// Get delivery settings (public - needed for customer checkout)
router.get("/", getDeliverySettings);

// Calculate delivery fee (public - needed for customer checkout)
router.post("/calculate", calculateDeliveryFee);

// Update delivery settings (admin only)
router.put("/", verifyToken, updateDeliverySettings);

export default router;