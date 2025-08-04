import { useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export const useOrderNotifications = (
  lastOrderCount,
  setLastOrderCount,
  activeComponent,
  setActiveComponent
) => {
  useEffect(() => {
    const checkForNewOrders = async () => {
      try {
        // Get API URL based on environment
        const apiUrl =
          import.meta.env.MODE === "development"
            ? "http://localhost:5000/api/orders"
            : "/api/orders";

        const response = await axios.get(apiUrl, { withCredentials: true });
        const currentOrderCount = response.data.length;

        // Set initial order count on first load
        if (lastOrderCount === 0) {
          setLastOrderCount(currentOrderCount);
          return;
        }

        // Check if we have new orders
        if (currentOrderCount > lastOrderCount) {
          const newOrdersCount = currentOrderCount - lastOrderCount;

          // Show toast notification
          toast.success(
            <div
              onClick={() => setActiveComponent("orders")}
              style={{ cursor: "pointer" }}
            >
              <b>
                {newOrdersCount} new order{newOrdersCount > 1 ? "s" : ""}{" "}
                received!
              </b>
              <br />
              <span style={{ fontSize: "0.8rem" }}>Click to view orders</span>
            </div>,
            {
              duration: 5000,
              style: {
                borderLeft: "4px solid #0070f3",
              },
            }
          );

          // If admin is not on orders page, also play sound
          if (activeComponent !== "orders") {
            const audio = new Audio("/notification.mp3");
            audio.play().catch((e) => console.log("Audio play failed:", e));
          }

          // Update order count
          setLastOrderCount(currentOrderCount);
        }
      } catch (error) {
        console.error("Error checking for new orders:", error);
      }
    };

    // Check immediately on mounting
    checkForNewOrders();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(checkForNewOrders, 30000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [lastOrderCount, activeComponent, setLastOrderCount, setActiveComponent]);
};