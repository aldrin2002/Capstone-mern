import { DeliverySettings } from "../models/deliverySettings.model.js";

// Get delivery settings
export const getDeliverySettings = async (req, res) => {
  try {
    let settings = await DeliverySettings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = new DeliverySettings({
        baseRate: 30,
        perKmRate: 10,
        freeDeliveryThreshold: 500,
        maxDeliveryDistance: 20
      });
      await settings.save();
    }
    
    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching delivery settings:", error);
    res.status(500).json({ message: "Error fetching delivery settings" });
  }
};

// Update delivery settings (Admin only)
export const updateDeliverySettings = async (req, res) => {
  try {
    const { baseRate, perKmRate, freeDeliveryThreshold, maxDeliveryDistance } = req.body;
    
    let settings = await DeliverySettings.findOne();
    
    if (!settings) {
      settings = new DeliverySettings();
    }
    
    settings.baseRate = baseRate;
    settings.perKmRate = perKmRate;
    settings.freeDeliveryThreshold = freeDeliveryThreshold;
    settings.maxDeliveryDistance = maxDeliveryDistance;
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: "Delivery settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating delivery settings:", error);
    res.status(500).json({ message: "Error updating delivery settings" });
  }
};

// Calculate delivery fee
export const calculateDeliveryFee = async (req, res) => {
  try {
    const { distance, orderTotal } = req.body;
    
    const settings = await DeliverySettings.findOne();
    
    if (!settings) {
      return res.status(404).json({ message: "Delivery settings not found" });
    }
    
    // Check if distance exceeds max
    if (distance > settings.maxDeliveryDistance) {
      return res.status(400).json({
        success: false,
        message: `Delivery is not available beyond ${settings.maxDeliveryDistance}km`
      });
    }
    
    // Calculate fee
    let deliveryFee = settings.baseRate + (distance * settings.perKmRate);
    
    // Check for free delivery
    if (orderTotal >= settings.freeDeliveryThreshold) {
      deliveryFee = 0;
    }
    
    res.status(200).json({
      success: true,
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      distance: parseFloat(distance.toFixed(2)),
      isFreeDelivery: deliveryFee === 0,
      breakdown: {
        baseRate: settings.baseRate,
        distanceCharge: parseFloat((distance * settings.perKmRate).toFixed(2)),
        total: parseFloat(deliveryFee.toFixed(2))
      }
    });
  } catch (error) {
    console.error("Error calculating delivery fee:", error);
    res.status(500).json({ message: "Error calculating delivery fee" });
  }
};