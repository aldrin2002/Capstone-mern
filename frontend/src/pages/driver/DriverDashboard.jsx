import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import {
  Loader,
  Truck,
  Package,
  User,
  Phone,
  MapPin,
  Route,
  PhilippinePeso,
  Clock3,
} from "lucide-react";
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

  const assignedCount = orders.filter((o) => String(o.status || "").toLowerCase().includes("assign")).length;
  const inProgressCount = orders.filter((o) => {
    const status = String(o.status || "").toLowerCase();
    return status.includes("deliver") || status.includes("transit") || status.includes("out");
  }).length;

  const getStatusPillClass = (status) => {
    const value = String(status || "").toLowerCase();
    if (value.includes("deliver") || value.includes("complete")) {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
    if (value.includes("cancel")) {
      return "bg-rose-100 text-rose-700 border-rose-200";
    }
    if (value.includes("assign")) {
      return "bg-primary-100 text-primary-800 border-primary-200";
    }
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  if (isLoading) return <div className="p-6"><Loader className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <DriverSideNav />

      {/* Main content - aligned to system design */}
      <main className={`flex-1 ${isMobile ? 'pb-24' : 'ml-64'} overflow-y-auto`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-brand via-primary-700 to-primary-900 rounded-2xl sm:rounded-3xl shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
              <div className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full text-primary-100 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                <Truck className="h-4 w-4 mr-2" />
                Driver Dashboard
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                Orders Summary
              </h1>
              <p className="text-primary-100 text-sm sm:text-base lg:text-lg max-w-2xl">
                Track assigned deliveries, inspect customer details, and manage active drop-offs in one place.
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">Total Orders</p>
                  <Package className="h-5 w-5 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{orders.length}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">Assigned</p>
                  <Truck className="h-5 w-5 text-brand" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{assignedCount}</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-sm">In Progress</p>
                <Route className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{inProgressCount}</p>
            </div>
          </section>

          {/* Orders list */}
          <div id="assigned" className="space-y-4">
            {orders.map(o => (
              <article key={o._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-50 to-primary-100 border-b border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                        Order #{o._id.toString().slice(-6)}
                      </h3>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1 flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "No timestamp"}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit items-center px-3 py-1 rounded-full border text-xs sm:text-sm font-semibold ${getStatusPillClass(o.status)}`}>
                      {o.status || "Pending"}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Customer info */}
                  <section className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-brand" />
                      Customer Info
                    </h4>
                    <div className="text-sm text-slate-700 space-y-2">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-0.5 text-slate-400" />
                        <span><span className="text-slate-500">Name:</span> <span className="font-semibold">{o.customer?.name || "N/A"}</span></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5 text-slate-400" />
                        <span><span className="text-slate-500">Phone:</span> <span className="font-semibold">{o.customer?.phone || "-"}</span></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-slate-400" />
                        <span><span className="text-slate-500">Address:</span> <span className="font-semibold">{o.deliveryAddress || "N/A"}</span></span>
                      </div>
                    </div>
                  </section>

                  {/* Delivery times */}
                  <section className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Route className="h-4 w-4 text-brand" />
                      Delivery Details
                    </h4>
                    <div className="text-sm text-slate-700 space-y-2">
                      {o.deliveryDistance !== undefined && (
                        <div className="flex items-center gap-2">
                          <Route className="h-4 w-4 text-slate-400" />
                          <span><span className="text-slate-500">Distance:</span> <span className="font-semibold">{Number(o.deliveryDistance).toFixed(2)} km</span></span>
                        </div>
                      )}
                      {o.deliveryFee !== undefined && (
                        <div className="flex items-center gap-2">
                          <PhilippinePeso className="h-4 w-4 text-slate-400" />
                          <span><span className="text-slate-500">Delivery Fee:</span> <span className="font-semibold">{Number(o.deliveryFee).toLocaleString("en-PH", { style: "currency", currency: "PHP" })}</span></span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Items */}
                  <section className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Package className="h-4 w-4 text-emerald-600" />
                      Items to Deliver
                    </h4>
                    <ul className="text-sm text-slate-700 space-y-2">
                      {(() => {
                        const items = Array.isArray(o.items)
                          ? o.items
                          : (typeof o.items === "object" && o.items !== null)
                            ? Object.values(o.items)
                            : [];
                        if (!items.length) {
                          return <li className="text-slate-500">No items listed.</li>;
                        }
                        return items.map(i => (
                          <li key={i?._id || `${i?.name || "item"}-${i?.quantity || 1}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 border border-slate-200">
                            <span className="font-medium text-slate-800">{i?.name || "Unnamed"}</span>
                            <span className="text-slate-600">x {i?.quantity ?? 1}</span>
                          </li>
                        ));
                      })()}
                    </ul>
                  </section>
                </div>
              </article>
            ))}
            {!orders.length && (
              <div className="bg-white rounded-2xl shadow-sm p-10 sm:p-12 text-center border border-slate-200">
                <Package className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No assigned orders yet.</p>
                <p className="text-slate-500 text-sm mt-1">New orders will appear here automatically.</p>
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