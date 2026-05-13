import { useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useMessageNotifications } from "../../context/MessageNotificationContext";
import { audioService } from "../../utils/audioService";

// Change to a named constant arrow function for consistent Hot Module Replacement
export const useOrderNotifications = (
  lastOrderCount,
  setLastOrderCount,
  activeComponent,
  setActiveComponent
) => {
  // Get socket from message notification context
  const { socket, isConnected } = useMessageNotifications();

  // Socket-based real-time notification
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (orderData) => {
      console.log("🔔 Real-time new order received:", orderData);

      // Update order count
      setLastOrderCount((prev) => prev + 1);

      // Format currency
      const formattedTotal = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(orderData.total);

      // Show toast notification
      toast.success(
        <div
          onClick={() => setActiveComponent("orders")}
          style={{ cursor: "pointer" }}
          className="flex flex-col"
        >
          <div className="font-bold flex items-center">
            <span className="bg-green-500 rounded-full w-2 h-2 mr-2 animate-pulse"></span>
            New Order Received!
          </div>
          <div className="text-sm mt-1">From: {orderData.customerName}</div>
          <div className="text-sm font-medium">{formattedTotal}</div>
          <div className="text-xs mt-1 text-brand hover:underline">
            Click to view details
          </div>
        </div>,
        {
          duration: 8000,
          style: {
            borderLeft: "4px solid #10B981",
            background: "linear-gradient(to right, #f0fff4, #ffffff)",
          },
          icon: "🛍️",
        }
      );

      // Play notification sound if not on orders page
      if (activeComponent !== "orders") {
        // SAFE PLAY: Use a try/catch to prevent potential errors
        try {
          audioService.playNotification();
        } catch (error) {
          console.error("🔊 Error playing notification:", error);
        }
      }
    };

    // Listen for real-time order events
    socket.on("new-order", handleNewOrder);

    // Clean up event listener
    return () => {
      socket.off("new-order", handleNewOrder);
    };
  }, [socket, activeComponent, setActiveComponent, setLastOrderCount]);

  // Keep the polling mechanism as a fallback
  useEffect(() => {
    const checkForNewOrders = async () => {
      try {
        // Skip if socket is connected (we're getting real-time updates)
        if (isConnected) return;

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
                borderLeft: "4px solid #F13E93",
              },
            }
          );

          // If admin is not on orders page, also play sound
          if (activeComponent !== "orders") {
            try {
              audioService.playSentSound();
            } catch (error) {
              console.error("🔊 Error playing sent sound:", error);
            }
          }

          // Update order count
          setLastOrderCount(currentOrderCount);
        }
      } catch (error) {
        console.error("Error checking for new orders:", error);
      }
    };

    // Only check periodically if socket isn't connected
    let interval;
    if (!isConnected) {
      // Check immediately on mounting
      checkForNewOrders();
      // Set up polling interval (every 30 seconds)
      interval = setInterval(checkForNewOrders, 30000);
    }

    // Clean up interval on unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lastOrderCount, activeComponent, setLastOrderCount, setActiveComponent, isConnected]);
};