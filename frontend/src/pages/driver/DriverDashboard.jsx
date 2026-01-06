import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { Loader, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import DriverSideNav from "./driverSideNav";
import { useMessageNotifications } from "../../context/MessageNotificationContext";

const DriverDashboard = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const API_URL = import.meta.env.MODE === "development" ? "http://localhost:5000/api/orders" : "/api/orders";

  // ✅ Real-time via sockets (no polling)
  const { socket, isConnected } = useMessageNotifications();

  // Initial load
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_URL}`, { withCredentials: true });
        const list = (res.data || []).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(list);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Socket listeners — rebind when socket connects
  useEffect(() => {
    if (!socket || !isConnected) return;

    const upsertOrder = (incoming) => {
      const order = incoming?.order || incoming; // normalize payload
      if (!order?._id) return;
      setOrders(prev => {
        const exists = prev.some(o => o._id === order._id);
        return exists ? prev.map(o => (o._id === order._id ? order : o)) : [order, ...prev];
      });
    };

    const handleAssignUpdate = (payload) => upsertOrder(payload);
    const handleOrderUpdated = (payload) => upsertOrder(payload);

    const handleNewOrder = (orderData) => {
      const orderId = orderData.orderId || orderData?.order?._id;
      const orderObj = orderData.order || orderData;
      if (!orderId) return;

      setOrders(prev => {
        const exists = prev.some(o => o._id === orderId);
        return exists ? prev : [{ _id: orderId, ...orderObj }, ...prev];
      });
    };

    socket.on("order-assigned", handleAssignUpdate);
    socket.on("order-updated", handleOrderUpdated);
    socket.on("new-order", handleNewOrder);

    return () => {
      socket.off("order-assigned", handleAssignUpdate);
      socket.off("order-updated", handleOrderUpdated);
      socket.off("new-order", handleNewOrder);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) return <div className="p-6"><Loader className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DriverSideNav />

      {/* Main content - aligned to system design */}
      <main className={`flex-1 ${isMobile ? 'pb-20' : 'ml-64'} overflow-y-auto`}>
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
            <div className="relative px-6 py-8">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-blue-200 text-sm font-medium mb-4">
                <Truck className="h-4 w-4 mr-2" />
                Driver Dashboard
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Orders Summary
              </h1>
              <p className="text-blue-100 text-lg">
                View customer details and delivery information orders.
              </p>
            </div>
          </div>

          {/* Orders list */}
          <div id="assigned" className="space-y-4">
            {orders.map(o => (
              <div key={o._id} className="bg-white rounded-2xl shadow-lg border overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        Order #{o._id.toString().slice(-6)}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Status: <span className="font-semibold">{o.status}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer info */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900">Customer Info</h4>
                    <div className="text-sm text-gray-700">
                      <div>Name: <span className="font-semibold">{o.customer?.name}</span></div>
                      <div>Phone: <span className="font-semibold">{o.customer?.phone || "-"}</span></div>
                      <div>Address: <span className="font-semibold">{o.deliveryAddress}</span></div>
                    </div>
                  </div>

                  {/* Delivery times */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900">Schedule</h4>
                    <div className="text-sm text-gray-700">
                      {o.deliveryDistance !== undefined && (
                        <div>Distance: <span className="font-semibold">{Number(o.deliveryDistance).toFixed(2)} km</span></div>
                      )}
                      {o.deliveryFee !== undefined && (
                        <div>Delivery Fee: <span className="font-semibold">₱{Number(o.deliveryFee).toFixed(2)}</span></div>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900">Items to Deliver</h4>
                    <ul className="text-sm text-gray-700 list-disc ml-5">
                      {(() => {
                        const items = Array.isArray(o.items)
                          ? o.items
                          : (typeof o.items === "object" && o.items !== null)
                            ? Object.values(o.items)
                            : [];
                        return items.map(i => (
                          <li key={i?._id || `${i?.name || "item"}-${i?.quantity || 1}`}>
                            {i?.name || "Unnamed"} x {i?.quantity ?? 1}
                          </li>
                        ));
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
            {!orders.length && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border">
                <p className="text-gray-600">No assigned orders.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;

// Render modal at root of page
// Place after default export so tree shakes properly
function DriverDashboardWrapper(props){
  return null;
}