import React, { useState, useEffect, useMemo } from "react";
import { 
  Loader, Users, Package, ShoppingCart, Download, FileSpreadsheet, Printer, TrendingUp, Award, PieChart, Clock, Calendar, X, Star, MessageSquare, ThumbsUp // ✅ Added Star, MessageSquare, ThumbsUp
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import ExcelJS from "exceljs";
import logoUrl from "../../assets/cafe-delicity-logo.jpg";

// Chart.js imports (ensure dependencies installed)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  BarElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const DashboardHome = ({ user, setActiveComponent }) => {
  // Raw orders
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Timeframe selector (quick presets)
  const [timeframe, setTimeframe] = useState("week"); // week | month | year

  // Custom date range (overrides timeframe if both selected)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Aggregated report object
  const [report, setReport] = useState(null);

  // ✅ NEW: Ratings state
  const [ratings, setRatings] = useState([]);
  const [isLoadingRatings, setIsLoadingRatings] = useState(true);
  const [ratingsStats, setRatingsStats] = useState({
    total: 0,
    average: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  // --- Fetch Orders --------------------------------------------------
  useEffect(() => { fetchOrders(); }, []);
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const url = import.meta.env.MODE === "development"
        ? "http://localhost:5000/api/orders"
        : "/api/orders";
      const res = await axios.get(url, { withCredentials: true });
      setOrders(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed loading orders");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Fetch ratings
  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setIsLoadingRatings(true);
    try {
      const url = import.meta.env.MODE === "development"
        ? "http://localhost:5000/api/orders/ratings/all"
        : "/api/orders/ratings/all";
      const res = await axios.get(url, { withCredentials: true });
      
      if (res.data.success) {
        setRatings(res.data.ratings || []);
        setRatingsStats({
          total: res.data.totalRatings || 0,
          average: res.data.averageRating || 0,
          distribution: res.data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        });
      }
    } catch (e) {
      console.error("Error fetching ratings:", e);
      toast.error("Failed to load ratings");
    } finally {
      setIsLoadingRatings(false);
    }
  };

  // --- Helper: preset date range from timeframe ----------------------
  const getPresetRange = () => {
    const now = new Date();
    let start, end;
    if (timeframe === "week") {
      const day = now.getDay();
      const diffToMon = (day === 0 ? -6 : 1) - day;
      start = new Date(now);
      start.setDate(now.getDate() + diffToMon);
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23,59,59,999);
    } else if (timeframe === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23,59,59,999);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23,59,59,999);
    }
    return { start, end };
  };

  // --- Date range (either custom or preset) --------------------------
  const activeRange = useMemo(() => {
    if (startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0,0,0,0);
      const e = new Date(endDate);
      e.setHours(23,59,59,999);
      if (s <= e) return { start: s, end: e };
    }
    return getPresetRange();
  }, [timeframe, startDate, endDate]);

  // --- Report generation whenever inputs change ---------------------
  useEffect(() => {
    generateReport(); // run even if orders empty to reset report
  }, [orders, activeRange]);

  // --- Core aggregation logic ---------------------------------------
  const generateReport = () => {
    const { start, end } = activeRange;

    if (!orders || orders.length === 0) {
      setReport({
        range: { start, end },
        products: [],
        mostPopular: null,
        totalRevenue: 0,
        totalItems: 0,
        totalOrders: 0,
        // Status counts kept for analytics (still shows cancelled)
        statusCounts: { Pending:0, Processing:0, Delivered:0, Completed:0, Cancelled:0 },
        bucket: { labels: [], revenueSeries: [], ordersSeries: [], itemsSeries: [] }
      });
      return;
    }

    // All orders inside date range (including cancelled for status distribution)
    const inRangeAll = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });

    // Sales-effective orders (EXCLUDES Cancelled) per requirement
    const salesOrders = inRangeAll.filter(o => o.status !== "Cancelled");

    // Status counts (based on all orders in range so we still show cancelled number)
    const statusCounts = { Pending:0, Processing:0, Delivered:0, Completed:0, Cancelled:0 };
    inRangeAll.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const productMap = new Map();
    let totalRevenue = 0;
    let totalItems = 0;

    // Bucket resolution (daily for <=31 days, else monthly)
    const diffDays = Math.ceil((end - start)/(1000*60*60*24));
    const useMonthly = diffDays > 31;
    const bucketMap = new Map();

    // Build buckets & product stats ONLY from non-cancelled salesOrders
    salesOrders.forEach(order => {
      const orderTotal = order.total || 0;
      totalRevenue += orderTotal;

      const od = new Date(order.createdAt);
      const bucketKey = useMonthly
        ? `${od.getFullYear()}-${String(od.getMonth()+1).padStart(2,"0")}`
        : od.toISOString().slice(0,10);

      if (!bucketMap.has(bucketKey)) {
        bucketMap.set(bucketKey, { revenue:0, orders:0, items:0 });
      }
      const bucket = bucketMap.get(bucketKey);
      bucket.revenue += orderTotal;
      bucket.orders += 1;

      (order.items || []).forEach(item => {
        const qty = item.quantity || 0;
        const price = item.price || 0;
        totalItems += qty;
        bucket.items += qty;

        const name = item.product?.name || item.name || "Unknown Product";
        const id = item.product?._id || item.productId || name;
        if (!productMap.has(id)) {
          productMap.set(id, { productId:id, name, quantity:0, revenue:0 });
        }
        const pAcc = productMap.get(id);
        pAcc.quantity += qty;
        pAcc.revenue += price * qty;
      });
    });

    const products = Array.from(productMap.values()).sort((a,b) => b.quantity - a.quantity);
    const mostPopular = products[0] || null;

    const bucketKeysSorted = Array.from(bucketMap.keys()).sort();
    const labels = bucketKeysSorted.map(k => {
      if (useMonthly) {
        const [y,m] = k.split("-");
        return new Date(Number(y), Number(m)-1, 1).toLocaleDateString("en-US",{ month:"short", year:"numeric"});
      }
      return new Date(k).toLocaleDateString("en-US",{ month:"short", day:"numeric"});
    });

    const revenueSeries = bucketKeysSorted.map(k => bucketMap.get(k).revenue);
    const ordersSeries  = bucketKeysSorted.map(k => bucketMap.get(k).orders);
    const itemsSeries   = bucketKeysSorted.map(k => bucketMap.get(k).items);

    setReport({
      range: { start, end },
      products,
      mostPopular,
      totalRevenue,
      totalItems,
      // totalOrders now counts ONLY non-cancelled orders
      totalOrders: salesOrders.length,
      statusCounts,
      bucket: { labels, revenueSeries, ordersSeries, itemsSeries }
    });
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { year:"numeric", month:"short", day:"numeric" });

  const getReportFilterLabel = () => {
    const customRange = startDate && endDate ? "Custom date range" : timeframeOptions.find(option => option.key === timeframe)?.label;
    return `${customRange}: ${formatDate(activeRange.start)} - ${formatDate(activeRange.end)}`;
  };

  const getReportKpis = () => ({
    "Total Orders": report.totalOrders,
    "Successful": (report.statusCounts.Completed || 0) + (report.statusCounts.Delivered || 0),
    "Cancelled": report.statusCounts.Cancelled || 0,
    "Pending": report.statusCounts.Pending || 0,
    "Revenue (PHP)": report.totalRevenue
  });

  // --- CSV Export (note: CSV cannot truly carry styling; we simulate structure) ----
  const downloadCSV = () => {
    if (!report) return;
    const {
      products,
      mostPopular,
      range,
      totalRevenue,
      totalItems,
      totalOrders,
      statusCounts
    } = report;

    const rows = [];
    rows.push(["Sales Report For Cafe Delicity"]);
    rows.push([`Generated At:`, new Date().toLocaleString()]);
    rows.push([`Date Range:`, `${formatDate(range.start)} - ${formatDate(range.end)}`]);
    if (mostPopular) {
      rows.push(["Most Popular Product:", mostPopular.name, "Qty", mostPopular.quantity, "Revenue", mostPopular.revenue.toFixed(2)]);
    }
    rows.push([]);
    rows.push(["ORDER STATISTICS (All orders)"]);
    rows.push(["Successful (Completed+Delivered)", (statusCounts.Completed||0)+(statusCounts.Delivered||0)]);
    rows.push(["Cancelled (Excluded from sales)", statusCounts.Cancelled || 0]);
    rows.push(["Pending", statusCounts.Pending || 0]);
    rows.push(["Processing", statusCounts.Processing || 0]);
    rows.push(["Total Sales Orders", totalOrders]);
    rows.push(["Total Items Sold", totalItems]);
    rows.push(["Total Revenue (PHP)", totalRevenue.toFixed(2)]);
    rows.push([]);
    rows.push(["PRODUCT SALES"]);
    rows.push(["Product","Quantity","Revenue"]);
    products.forEach(p => {
      rows.push([p.name, p.quantity, p.revenue.toFixed(2)]);
    });
    rows.push([]);
    rows.push(["TIME SERIES (Revenue / Orders / Items)"]);
    rows.push(["Label","Revenue","Orders","Items"]);
    report.bucket.labels.forEach((label, i) => {
      rows.push([
        label,
        report.bucket.revenueSeries[i],
        report.bucket.ordersSeries[i],
        report.bucket.itemsSeries[i]
      ]);
    });

    // Convert to CSV escaping
    const csv = rows.map(r => r.map(field => {
      const v = (field ?? "").toString();
      return /[",\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v;
    }).join(",")).join("\n");

    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    if (!report) return;

    const kpis = getReportKpis();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");
    worksheet.columns = [
      { width: 30 }, { width: 22 }, { width: 20 }, { width: 14 }
    ];
    worksheet.addRows([
      ["", "CAFE DELICITY", "", ""],
      ["", "Sales & Analytics Report", "", ""],
      ["Date Filter", getReportFilterLabel(), "", ""],
      ["Generated At", new Date().toLocaleString(), "", ""],
      [],
      ["KPI SUMMARY", "", "", ""],
      ...Object.entries(kpis).map(([label, value]) => [label, value, "", ""]),
      [],
      ["PRODUCT SALES", "", "", ""],
      ["Product", "Quantity", "Revenue (PHP)", ""],
      ...report.products.map(product => [product.name, product.quantity, product.revenue, ""]),
      [],
      ["TIME SERIES", "", "", ""],
      ["Period", "Revenue (PHP)", "Orders", "Items"],
      ...report.bucket.labels.map((label, index) => [
        label,
        report.bucket.revenueSeries[index],
        report.bucket.ordersSeries[index],
        report.bucket.itemsSeries[index]
      ])
    ]);
    worksheet.mergeCells("B1:D1");
    worksheet.mergeCells("B2:D2");
    worksheet.mergeCells("A6:D6");
    worksheet.mergeCells(`A${16 + report.products.length}:D${16 + report.products.length}`);

    const plum = "581845";
    const magenta = "E02588";
    const palePink = "FCE4F1";
    const styleRow = (rowNumber, fill, fontColor = "FFFFFF") => {
      worksheet.getRow(rowNumber).eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${fill}` } };
        cell.font = { bold: true, color: { argb: `FF${fontColor}` } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });
    };
    [1, 2].forEach(row => styleRow(row, row === 1 ? magenta : plum));
    [6, 13, 16 + report.products.length].forEach(row => styleRow(row, plum));
    [14, 17 + report.products.length].forEach(row => styleRow(row, magenta));
    [7, 8, 9, 10, 11].forEach(row => {
      worksheet.getCell(`A${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${palePink}` } };
      worksheet.getCell(`A${row}`).font = { bold: true, color: { argb: `FF${plum}` } };
    });
    worksheet.getColumn(2).numFmt = "0.00";
    worksheet.getColumn(3).numFmt = "0.00";
    worksheet.getRow(1).height = 48;
    worksheet.getRow(2).height = 28;

    const logoResponse = await fetch(logoUrl);
    const logoBuffer = await logoResponse.arrayBuffer();
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: "jpeg" });
    worksheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 74, height: 74 } });

    const fileBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([fileBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cafe_delicity_sales_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const printReport = () => {
    if (!report) return;
    const kpis = getReportKpis();
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the report");
      return;
    }

    const kpiCards = Object.entries(kpis).map(([label, value]) => `
      <div class="kpi"><span>${escapeHtml(label)}</span><strong>${label === "Revenue (PHP)" ? `PHP ${Number(value).toFixed(2)}` : escapeHtml(value)}</strong></div>
    `).join("");
    const productRows = report.products.map(product => `
      <tr><td>${escapeHtml(product.name)}</td><td>${product.quantity}</td><td>PHP ${product.revenue.toFixed(2)}</td></tr>
    `).join("");
    const seriesRows = report.bucket.labels.map((label, index) => `
      <tr><td>${escapeHtml(label)}</td><td>PHP ${Number(report.bucket.revenueSeries[index]).toFixed(2)}</td><td>${report.bucket.ordersSeries[index]}</td><td>${report.bucket.itemsSeries[index]}</td></tr>
    `).join("");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>Café Delicity Sales Report</title><style>
      @page { size: A4; margin: 16mm; } * { box-sizing: border-box; } body { margin: 0; color: #2d1728; font: 12px Arial, sans-serif; }
      header { display: flex; align-items: center; gap: 18px; padding: 18px 20px; color: #fff; background: linear-gradient(110deg, #E02588, #581845); }
      header img { width: 74px; height: 74px; object-fit: cover; border-radius: 50%; border: 3px solid #fff; } h1 { margin: 0 0 5px; font-size: 24px; } h2 { margin: 22px 0 8px; color: #581845; border-bottom: 2px solid #E02588; padding-bottom: 5px; }
      .meta { margin: 16px 0; padding: 10px 14px; background: #fce4f1; border-left: 4px solid #E02588; } .kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; } .kpi { padding: 10px; background: #581845; color: #fff; min-height: 54px; } .kpi span { display: block; font-size: 10px; opacity: .8; } .kpi strong { display: block; margin-top: 4px; font-size: 15px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 12px; } th { background: #E02588; color: #fff; text-align: left; } th, td { padding: 7px 8px; border: 1px solid #e7cedc; } tr:nth-child(even) { background: #fff4fa; } td:not(:first-child), th:not(:first-child) { text-align: right; } .empty { color: #777; font-style: italic; }
      @media print { .no-print { display: none; } }
    </style></head><body>
      <header><img src="${escapeHtml(logoUrl)}" alt="Café Delicity logo"><div><h1>Café Delicity</h1><div>Sales &amp; Analytics Report</div></div></header>
      <div class="meta"><strong>Date filter:</strong> ${escapeHtml(getReportFilterLabel())}<br><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString())}</div>
      <h2>KPI Summary</h2><div class="kpis">${kpiCards}</div>
      <h2>Product Sales</h2><table><thead><tr><th>Product</th><th>Quantity</th><th>Revenue (PHP)</th></tr></thead><tbody>${productRows || '<tr><td class="empty" colspan="3">No sales data for selected range</td></tr>'}</tbody></table>
      <h2>Time Series</h2><table><thead><tr><th>Period</th><th>Revenue (PHP)</th><th>Orders</th><th>Items</th></tr></thead><tbody>${seriesRows || '<tr><td class="empty" colspan="4">No activity for selected range</td></tr>'}</tbody></table>
      <script>window.onload = function () { window.focus(); window.print(); };</script>
    </body></html>`);
    printWindow.document.close();
  };

  // --- Chart Config Builders ----------------------------------------
  const chartOptionsLine = {
    responsive:true,
    maintainAspectRatio:false,
    interaction:{ mode:"index", intersect:false },
    plugins:{ legend:{ display:true }, tooltip:{ enabled:true } },
    scales:{
      x:{ ticks:{ color:"#475569" }, grid:{ display:false } },
      y:{ ticks:{ color:"#475569" }, grid:{ color:"#e2e8f0" } }
    }
  };

  const chartOptionsBar = {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{ legend:{ display:false } },
    scales:{
      x:{ ticks:{ color:"#475569" }, grid:{ display:false } },
      y:{ ticks:{ color:"#475569" }, grid:{ color:"#e2e8f0" } }
    }
  };

  const chartOptionsPie = {
    responsive:true,
    maintainAspectRatio:false,
    plugins:{ legend:{ position:"bottom" } }
  };

  // Memo data sets
  const lineData = useMemo(() => report ? ({
    labels: report.bucket.labels,
    datasets:[
      {
        label:"Revenue (₱)",
        data: report.bucket.revenueSeries,
        borderColor:"#16a34a",
        backgroundColor:"rgba(22,163,74,0.15)",
        tension:0.35,
        fill:true
      },
      {
        label:"Orders",
        data: report.bucket.ordersSeries,
        borderColor:"#F13E93",
        backgroundColor:"rgba(241,62,147,0.15)",
        tension:0.35,
        fill:true
      },
      {
        label:"Items",
        data: report.bucket.itemsSeries,
        borderColor:"#7c3aed",
        backgroundColor:"rgba(124,58,237,0.15)",
        tension:0.35,
        fill:true
      }
    ]
  }) : null, [report]);

  const topProductsBarData = useMemo(() => report ? ({
    labels: report.products.slice(0,8).map(p => p.name),
    datasets:[{
      label:"Quantity Sold",
      data: report.products.slice(0,8).map(p => p.quantity),
      backgroundColor:"rgba(241,62,147,0.6)"
    }]
  }) : null, [report]);

  const statusPieData = useMemo(() => report ? ({
    labels:["Pending","Processing","Delivered","Completed","Cancelled"],
    datasets:[{
      data:[
        report.statusCounts.Pending || 0,
        report.statusCounts.Processing || 0,
        report.statusCounts.Delivered || 0,
        report.statusCounts.Completed || 0,
        report.statusCounts.Cancelled || 0
      ],
      backgroundColor:[
        "#fbbf24","#F13E93","#8b5cf6","#10b981","#ef4444"
      ],
      borderColor:"#ffffff",
      borderWidth:2
    }]
  }) : null, [report]);

  // Quick timeframe buttons
  const timeframeOptions = [
    { key:"week", label:"This Week" },
    { key:"month", label:"This Month" },
    { key:"year", label:"This Year" }
  ];

  // Loading state
  if (isLoading && !report) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-brand rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-brand rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Preparing sales report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-primary-100 min-h-full">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-brand to-primary-700 p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Sales & Analytics Report</h2>
            <p className="text-primary-100 text-lg">{user.name}</p>
          </div>
        </div>
        <div className="p-4 sm:p-6 space-y-6">

          {/* Controls */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center">
            {timeframeOptions.map(t => (
              <button
                key={t.key}
                onClick={() => { setTimeframe(t.key); setStartDate(""); setEndDate(""); }}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  timeframe === t.key && !startDate && !endDate
                    ? "bg-brand text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}

            {/* Modern minimalist date range picker */}
            <div className="group w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:shadow transition">
              <Calendar className="w-4 h-4 text-brand" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="peer w-full appearance-none bg-transparent px-2 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white border border-gray-200 hover:border-gray-300 transition"
                  />
                  <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 rounded opacity-0 peer-focus:opacity-100 peer-valid:opacity-100 transition">Start</label>
                </div>
                <span className="text-gray-400 text-xs hidden sm:inline">→</span>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="peer w-full appearance-none bg-transparent px-2 py-1 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white border border-gray-200 hover:border-gray-300 transition"
                  />
                  <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500 rounded opacity-0 peer-focus:opacity-100 peer-valid:opacity-100 transition">End</label>
                </div>
              </div>
              {startDate && endDate && (
                <button
                  type="button"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="sm:ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-gray-500 transition"
                  title="Clear range"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => generateReport()}
                disabled={!startDate || !endDate}
                className="sm:ml-1 w-full sm:w-auto px-3 py-1.5 rounded-md text-xs font-medium bg-brand text-white disabled:opacity-40 hover:bg-primary-700 transition"
              >
                Apply
              </button>
            </div>

            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              <button
                onClick={downloadCSV}
                disabled={!report}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>CSV</span>
              </button>
              <button
                onClick={downloadExcel}
                disabled={!report}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[#581845] text-white hover:bg-[#431235] transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={printReport}
                disabled={!report}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[#E02588] text-white hover:bg-[#b91d6f] transition-all disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                <span>PDF / Print</span>
              </button>
            </div>
          </div>

          {/* KPI Cards */}
            {report && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <KpiCard label="Total Orders" value={report.totalOrders} color="primary" icon={<ShoppingCart className="w-5 h-5" />} />
                <KpiCard label="Successful" value={(report.statusCounts.Completed||0)+(report.statusCounts.Delivered||0)} color="green" icon={<CheckIcon />} />
                <KpiCard label="Cancelled" value={report.statusCounts.Cancelled||0} color="red" icon={<CancelIcon />} />
                <KpiCard label="Pending" value={report.statusCounts.Pending||0} color="yellow" icon={<Clock className="w-5 h-5" />} />
                <KpiCard label="Revenue (₱)" value={report.totalRevenue.toFixed(2)} color="purple" icon={<TrendingUp className="w-5 h-5" />} />
              </div>
            )}

          {/* Most Popular Product */}
          {report?.mostPopular && (
            <div className="bg-gradient-to-r from-primary-100 to-primary-200 border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-brand text-white flex items-center justify-center shadow shrink-0">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Most Ordered Product</p>
                  <p className="text-lg font-bold text-gray-800">{report.mostPopular.name}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {report.mostPopular.quantity} • Revenue: ₱{report.mostPopular.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-500">Date Range</p>
                <p className="text-sm font-medium text-gray-800">
                  {report?.range?.start ? formatDate(report.range.start) : "--"} – {report?.range?.end ? formatDate(report.range.end) : "--"}
                </p>
              </div>
            </div>
          )}

          {/* Charts */}
          {report && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Products Bar (moved to top, full width) */}
              <div className="bg-white rounded-2xl shadow-md border p-4 sm:p-5 lg:col-span-3 h-72 sm:h-80">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-brand" />Top Products (Quantity)
                </h3>
                {topProductsBarData && <Bar data={topProductsBarData} options={chartOptionsBar} />}
              </div>

              {/* Sales Trend (moved below) */}
              <div className="bg-white rounded-2xl shadow-md border p-4 sm:p-5 lg:col-span-2 h-72 sm:h-80">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Sales Trend
                  </h3>
                  <span className="text-xs text-gray-500">
                    {timeframe === "year" ? "Monthly" : startDate && endDate ? "Selected Range" : "Daily"}
                  </span>
                </div>
                {lineData && <Line data={lineData} options={chartOptionsLine} />}
              </div>

              {/* Order Status Pie (moved below) */}
              <div className="bg-white rounded-2xl shadow-md border p-4 sm:p-5 h-72 sm:h-80">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-purple-600" />Order Status
                </h3>
                {statusPieData && <Pie data={statusPieData} options={chartOptionsPie} />}
              </div>
            </div>
          )}

          {/* Product Sales Table */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-primary-100 border-b">
              <h3 className="font-bold text-gray-700 text-sm">
                Product Sales ({report?.products.length || 0})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Product</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Quantity</th>
                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Revenue (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.products.length ? (
                    report.products.map(p => (
                      <tr key={p.productId} className="border-t hover:bg-primary-100/50">
                        <td className="px-6 py-3 font-medium text-gray-800">{p.name}</td>
                        <td className="px-6 py-3 text-right text-gray-700">{p.quantity}</td>
                        <td className="px-6 py-3 text-right text-gray-700">{p.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                        No sales data for selected range
                      </td>
                    </tr>
                  )}
                </tbody>
                {report && report.products.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t">
                      <td className="px-6 py-3 font-bold text-gray-800">TOTAL</td>
                      <td className="px-6 py-3 text-right font-bold text-gray-800">{report.totalItems}</td>
                      <td className="px-6 py-3 text-right font-bold text-gray-800">
                        {report.totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* ✅ NEW: Ratings & Feedback Section */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Star className="w-5 h-5 text-white" fill="white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">Customer Ratings & Feedback</h3>
                    <p className="text-sm text-gray-600">
                      {ratingsStats.total} {ratingsStats.total === 1 ? 'review' : 'reviews'}
                    </p>
                  </div>
                </div>
                
                {/* Average Rating Badge */}
                {ratingsStats.total > 0 && (
                  <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-xl border-2 border-yellow-300">
                    <Star className="w-6 h-6 text-yellow-600" fill="currentColor" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-800">
                        {ratingsStats.average.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-600">Average</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Distribution */}
            {ratingsStats.total > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingsStats.distribution[star] || 0;
                    const percentage = ratingsStats.total > 0 
                      ? ((count / ratingsStats.total) * 100).toFixed(0) 
                      : 0;
                    
                    return (
                      <div key={star} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 min-w-[60px]">
                          <span className="text-sm font-bold text-gray-700">{star}</span>
                          <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-600 min-w-[50px] text-right">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ratings List */}
            <div className="max-h-[70vh] sm:max-h-[600px] overflow-y-auto">
              {isLoadingRatings ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading ratings...</p>
                  </div>
                </div>
              ) : ratings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Ratings Yet</h3>
                  <p className="text-gray-600">Customer ratings and feedback will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {ratings.map((rating, index) => (
                    <div 
                      key={rating._id} 
                      className="p-6 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-300 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          {/* Customer Avatar */}
                          <div className="w-12 h-12 bg-gradient-to-br from-brand to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                            {rating.customer?.name?.charAt(0).toUpperCase() || 'C'}
                          </div>
                          
                          {/* Customer Info */}
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 text-lg">
                              {rating.customer?.name || 'Anonymous'}
                            </h4>
                            <p className="text-sm text-gray-500 break-words">
                              Order #{rating._id.slice(-8)} • {new Date(rating.ratedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Star Rating */}
                        <div className="self-start sm:self-auto flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-2 rounded-full border-2 border-yellow-300 group-hover:scale-110 transition-transform duration-300">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= rating.rating
                                  ? 'text-yellow-500 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Feedback Text */}
                      <div className="ml-0 sm:ml-14 pl-3 border-l-4 border-primary-200 group-hover:border-primary-400 transition-colors duration-300">
                        <div className="flex items-start space-x-2">
                          <MessageSquare className="w-5 h-5 text-brand mt-1 flex-shrink-0" />
                          <p className="text-gray-700 leading-relaxed">
                            "{rating.feedback}"
                          </p>
                        </div>
                      </div>

                      {/* Rating Emotion Badge */}
                      <div className="ml-0 sm:ml-14 mt-3 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm">
                        <span className="mr-2">
                          {rating.rating === 5 && "🤩"}
                          {rating.rating === 4 && "😊"}
                          {rating.rating === 3 && "🙂"}
                          {rating.rating === 2 && "😐"}
                          {rating.rating === 1 && "😞"}
                        </span>
                        <span className="font-medium text-gray-700">
                          {rating.rating === 5 && "Excellent"}
                          {rating.rating === 4 && "Very Good"}
                          {rating.rating === 3 && "Good"}
                          {rating.rating === 2 && "Fair"}
                          {rating.rating === 1 && "Poor"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Stats */}
            {ratings.length > 0 && (
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-primary-100 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">
                        <span className="font-bold text-gray-800">
                          {ratingsStats.distribution[5] + ratingsStats.distribution[4]}
                        </span> positive reviews
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500" fill="currentColor" />
                      <span className="text-gray-700">
                        <span className="font-bold text-gray-800">{ratingsStats.average.toFixed(2)}</span> average rating
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={fetchRatings}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-brand to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform sm:hover:scale-105 shadow-lg font-medium text-sm"
                  >
                    Refresh Ratings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuickButton icon={<ShoppingCart className="w-5 h-5 text-brand" />} label="Orders" onClick={() => setActiveComponent("orders")} />
              <QuickButton icon={<Package className="w-5 h-5 text-purple-600" />} label="Products" onClick={() => setActiveComponent("products")} />
              <QuickButton icon={<Users className="w-5 h-5 text-orange-600" />} label="Users" onClick={() => setActiveComponent("users")} />
              <QuickButton icon={<Package className="w-5 h-5 text-green-600" />} label="Gallery" onClick={() => setActiveComponent("gallery")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reusable UI pieces ----------------------------------------------
const KpiCard = ({ label, value, color, icon }) => {
  const colorMap = {
    primary:"from-brand to-primary-700",
    green:"from-green-500 to-green-600",
    red:"from-red-500 to-red-600",
    yellow:"from-yellow-500 to-yellow-600",
    purple:"from-purple-500 to-purple-600"
  };
  return (
    <div className="bg-white rounded-2xl shadow p-3 sm:p-4 border flex items-center justify-between gap-3 group hover:shadow-md transition">
      <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorMap[color] || colorMap.primary} flex items-center justify-center text-white shadow`}>
        {icon}
      </div>
    </div>
  );
};

const QuickButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="p-4 bg-white border rounded-xl hover:shadow group transition flex items-center space-x-2"
  >
    {icon}
    <span className="text-sm font-medium text-gray-700 group-hover:text-brand">{label}</span>
  </button>
);

// Simple icons for statuses
const CheckIcon = () => <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>;
const CancelIcon = () => <svg className="w-5 h-5" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;

export default DashboardHome;