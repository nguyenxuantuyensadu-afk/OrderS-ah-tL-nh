import { useState, useMemo, useEffect } from 'react';
import { Order } from '../types';
import { formatCurrency } from '../data';
import {
  Calendar,
  Receipt,
  TrendingUp,
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  QrCode,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Filter,
  Layers,
  ChevronRight,
  Flame,
  Trophy
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  Cell
} from 'recharts';

interface DailyStat {
  dateKey: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  fullDate: string; // DD/MM/YYYY
  dayOfWeek: string;
  isToday: boolean;
  isYesterday: boolean;
  revenue: number;
  cashRevenue: number;
  qrRevenue: number;
  orderCount: number;
  avgOrderValue: number;
}

interface TopSellingItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  rank: number;
  displayName: string;
  percentQty: number;
  percentRev: number;
}

const TOP_RANK_COLORS = [
  '#f59e0b', // #1 Amber/Gold
  '#3b82f6', // #2 Blue
  '#10b981', // #3 Emerald
  '#8b5cf6', // #4 Purple
  '#ec4899', // #5 Pink
];

export default function RevenueTab({ orders }: { orders: Order[] }) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('completed');
  const [rangeDays, setRangeDays] = useState<number>(7); // 7, 14, 30, or 0 (all)
  const [selectedDayKey, setSelectedDayKey] = useState<string>('all');
  const [chartView, setChartView] = useState<'composed' | 'revenue' | 'orders'>('composed');
  const [topSortBy, setTopSortBy] = useState<'quantity' | 'revenue'>('quantity');
  const [topScope, setTopScope] = useState<'all' | 'period'>('all');
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Completed & Active orders
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);
  const activeOrders = useMemo(() => orders.filter(o => o.status === 'in_kitchen' || o.status === 'ready'), [orders]);

  const totalRevenue = useMemo(
    () => completedOrders.reduce((sum, order) => sum + order.total, 0),
    [completedOrders]
  );
  const pendingRevenue = useMemo(
    () => activeOrders.reduce((sum, order) => sum + order.total, 0),
    [activeOrders]
  );

  // Group completed orders by day
  const dailyStatsMap = useMemo(() => {
    const map = new Map<string, {
      total: number;
      cash: number;
      qr: number;
      count: number;
      timestamp: number;
    }>();

    completedOrders.forEach(order => {
      const time = order.completedAt || order.timestamp;
      const date = new Date(time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const current = map.get(key) || { total: 0, cash: 0, qr: 0, count: 0, timestamp: time };
      current.total += order.total;
      current.count += 1;
      if (order.paymentMethod === 'cash') {
        current.cash += order.total;
      } else {
        current.qr += order.total;
      }
      map.set(key, current);
    });

    return map;
  }, [completedOrders]);

  // Today & Yesterday date keys
  const todayKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayKey = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Generate sequence of dates for the selected range (e.g. last 7 or 14 days)
  const chartData: DailyStat[] = useMemo(() => {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    if (rangeDays === 0) {
      // All days with orders sorted chronologically
      const keys = Array.from(dailyStatsMap.keys()) as string[];
      keys.sort();
      if (keys.length === 0) {
        // Fallback: show last 7 days
        keys.push(todayKey);
      }

      return keys.map((key: string) => {
        const [year, month, day] = key.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        const stat = dailyStatsMap.get(key) || { total: 0, cash: 0, qr: 0, count: 0 };
        return {
          dateKey: key,
          displayDate: `${day}/${month}`,
          fullDate: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
          dayOfWeek: dayNames[dateObj.getDay()],
          isToday: key === todayKey,
          isYesterday: key === yesterdayKey,
          revenue: stat.total,
          cashRevenue: stat.cash,
          qrRevenue: stat.qr,
          orderCount: stat.count,
          avgOrderValue: stat.count > 0 ? Math.round(stat.total / stat.count) : 0,
        };
      });
    }

    // Fixed sequence of the last N days (including today)
    const list: DailyStat[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;

      const stat = dailyStatsMap.get(key) || { total: 0, cash: 0, qr: 0, count: 0 };

      list.push({
        dateKey: key,
        displayDate: `${day}/${month}`,
        fullDate: `${day}/${month}/${year}`,
        dayOfWeek: dayNames[d.getDay()],
        isToday: key === todayKey,
        isYesterday: key === yesterdayKey,
        revenue: stat.total,
        cashRevenue: stat.cash,
        qrRevenue: stat.qr,
        orderCount: stat.count,
        avgOrderValue: stat.count > 0 ? Math.round(stat.total / stat.count) : 0,
      });
    }
    return list;
  }, [rangeDays, dailyStatsMap, todayKey, yesterdayKey]);

  // Comparative KPIs
  const todayStat = useMemo(() => dailyStatsMap.get(todayKey) || { total: 0, count: 0, cash: 0, qr: 0 }, [dailyStatsMap, todayKey]);
  const yesterdayStat = useMemo(() => dailyStatsMap.get(yesterdayKey) || { total: 0, count: 0, cash: 0, qr: 0 }, [dailyStatsMap, yesterdayKey]);

  // % comparison
  const growthRate = useMemo(() => {
    if (yesterdayStat.total === 0) {
      return todayStat.total > 0 ? 100 : 0;
    }
    return Math.round(((todayStat.total - yesterdayStat.total) / yesterdayStat.total) * 100);
  }, [todayStat.total, yesterdayStat.total]);

  // Best day in the dataset
  const bestDay = useMemo(() => {
    let maxRev = 0;
    let maxDay: DailyStat | null = null;
    chartData.forEach(item => {
      if (item.revenue > maxRev) {
        maxRev = item.revenue;
        maxDay = item;
      }
    });
    return maxDay;
  }, [chartData]);

  // Average daily revenue in selected range
  const avgDailyRevenue = useMemo(() => {
    const daysWithRevenue = chartData.filter(d => d.revenue > 0);
    if (daysWithRevenue.length === 0) return 0;
    const sum = daysWithRevenue.reduce((acc, d) => acc + d.revenue, 0);
    return Math.round(sum / daysWithRevenue.length);
  }, [chartData]);

  // Filtered orders list based on status and selected day
  const displayedOrders = useMemo(() => {
    return orders.filter(order => {
      // Status filter
      if (filterStatus === 'completed' && order.status !== 'completed') return false;
      if (filterStatus === 'active' && order.status !== 'in_kitchen' && order.status !== 'ready') return false;

      // Day filter
      if (selectedDayKey !== 'all') {
        const time = order.completedAt || order.timestamp;
        const date = new Date(time);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${d}`;
        if (key !== selectedDayKey) return false;
      }

      return true;
    }).sort((a, b) => (b.completedAt || b.timestamp) - (a.completedAt || a.timestamp));
  }, [orders, filterStatus, selectedDayKey]);

  // Top 5 best-selling items calculated from completed orders
  const topSellingData = useMemo(() => {
    // Filter orders based on scope
    const targetOrders = topScope === 'period' && rangeDays > 0
      ? completedOrders.filter(order => {
          const time = order.completedAt || order.timestamp;
          const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
          return time >= cutoff;
        })
      : completedOrders;

    const itemMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      quantity: number;
      revenue: number;
    }>();

    let totalQty = 0;
    let totalRev = 0;

    targetOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const cleanName = (item.name || '').trim();
        const key = cleanName || item.id;
        const current = itemMap.get(key) || {
          id: item.id || key,
          name: cleanName || 'Món không tên',
          category: item.category || 'Khác',
          quantity: 0,
          revenue: 0,
        };
        const qty = item.quantity || 1;
        const rev = (item.price || 0) * qty;

        current.quantity += qty;
        current.revenue += rev;
        totalQty += qty;
        totalRev += rev;
        itemMap.set(key, current);
      });
    });

    const items = Array.from(itemMap.values());
    // Sort according to topSortBy
    items.sort((a, b) => {
      if (topSortBy === 'quantity') {
        return b.quantity - a.quantity || b.revenue - a.revenue;
      }
      return b.revenue - a.revenue || b.quantity - a.quantity;
    });

    const top5: TopSellingItem[] = items.slice(0, 5).map((it, idx) => ({
      ...it,
      rank: idx + 1,
      displayName: it.name.length > 14 ? `#${idx + 1} ${it.name.slice(0, 13)}…` : `#${idx + 1} ${it.name}`,
      percentQty: totalQty > 0 ? Math.round((it.quantity / totalQty) * 100) : 0,
      percentRev: totalRev > 0 ? Math.round((it.revenue / totalRev) * 100) : 0,
    }));

    return {
      top5,
      totalQty,
      totalRev,
      ordersCount: targetOrders.length,
      hasData: top5.length > 0,
    };
  }, [completedOrders, topScope, rangeDays, topSortBy]);

  return (
    <div className="p-2.5 sm:p-5 lg:p-8 bg-gray-50/50 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-3.5 sm:space-y-6 pb-28 sm:pb-20">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 uppercase tracking-wide">
                Báo cáo & Phân tích
              </span>
              <span className="text-[11px] font-semibold text-gray-400 hidden sm:inline">
                • Thống kê và so sánh doanh thu theo ngày
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-gray-800 tracking-tight mt-1">Báo cáo Doanh thu</h2>
            <p className="text-xs sm:text-sm text-gray-500">So sánh doanh thu theo ngày, cơ cấu thanh toán và lịch sử giao dịch</p>
          </div>

          {/* Quick Date Range Picker - Full width segmented control on mobile */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-xs w-full sm:w-auto overflow-x-auto scrollbar-none">
            <button
              onClick={() => setRangeDays(7)}
              className={`flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                rangeDays === 7 ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              7 ngày
            </button>
            <button
              onClick={() => setRangeDays(14)}
              className={`flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                rangeDays === 14 ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              14 ngày
            </button>
            <button
              onClick={() => setRangeDays(30)}
              className={`flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                rangeDays === 30 ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              30 ngày
            </button>
            <button
              onClick={() => setRangeDays(0)}
              className={`flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[38px] flex items-center justify-center ${
                rangeDays === 0 ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>
        
        {/* Metric Cards - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          
          {/* Card 1: Doanh thu Hôm nay */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider">Hôm nay</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Calendar size={15} />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-black text-gray-800 truncate">
                {formatCurrency(todayStat.total)}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] truncate">
                {growthRate >= 0 ? (
                  <span className="text-emerald-600 font-bold flex items-center shrink-0">
                    <ArrowUpRight size={13} />
                    +{growthRate}%
                  </span>
                ) : (
                  <span className="text-rose-600 font-bold flex items-center shrink-0">
                    <ArrowDownRight size={13} />
                    {growthRate}%
                  </span>
                )}
                <span className="text-gray-400 truncate">
                  <span className="hidden sm:inline">so hôm qua ({formatCurrency(yesterdayStat.total)})</span>
                  <span className="sm:hidden">vs hôm qua</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Tổng doanh thu thực thu */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider">Tổng thực thu</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendingUp size={15} />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-black text-emerald-600 truncate">
                {formatCurrency(totalRevenue)}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">
                {completedOrders.length} đơn hoàn tất
              </p>
            </div>
          </div>

          {/* Card 3: Trung bình / ngày */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider">TB / ngày</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Receipt size={15} />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-black text-blue-600 truncate">
                {formatCurrency(avgDailyRevenue)}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">
                Tính theo ngày có đơn
              </p>
            </div>
          </div>

          {/* Card 4: Ngày kỷ lục cao nhất */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-gray-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider">Kỷ lục ngày</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Award size={15} />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-black text-purple-700 truncate">
                {bestDay && bestDay.revenue > 0 ? formatCurrency(bestDay.revenue) : '0 ₫'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1 truncate">
                {bestDay && bestDay.revenue > 0 ? `${bestDay.displayDate} (${bestDay.orderCount} đơn)` : 'Chưa có'}
              </p>
            </div>
          </div>

        </div>

        {/* Chart Section */}
        <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                  <BarChart3 size={18} />
                </div>
                <h3 className="text-sm sm:text-lg font-black text-gray-800">
                  Biểu đồ doanh thu theo ngày
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Chạm cột ngày để lọc danh sách đơn chi tiết bên dưới
              </p>
            </div>

            {/* View Mode Toggle - Responsive pill group */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => setChartView('composed')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 flex items-center justify-center ${
                  chartView === 'composed'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Tổng hợp
              </button>
              <button
                onClick={() => setChartView('revenue')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 flex items-center justify-center ${
                  chartView === 'revenue'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Tiền mặt / QR
              </button>
              <button
                onClick={() => setChartView('orders')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[34px] sm:min-h-0 flex items-center justify-center ${
                  chartView === 'orders'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Số đơn
              </button>
            </div>
          </div>

          {/* Chart Container - Horizontal swipe on mobile when many days */}
          <div className="w-full overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 sm:mx-0 sm:px-0">
            <div
              className="h-64 sm:h-80"
              style={{
                minWidth: chartData.length > 7 ? `${Math.max(chartData.length * 42, 320)}px` : '100%'
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'composed' ? (
                  <ComposedChart
                    data={chartData}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        setSelectedDayKey(state.activePayload[0].payload.dateKey);
                      }
                    }}
                    margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -22 : -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#3b82f6' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as DailyStat;
                        return (
                          <div className="bg-gray-900/95 backdrop-blur-sm text-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-gray-700 text-xs min-w-[190px] sm:min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-gray-700/80 pb-1.5 mb-2">
                              <span className="font-bold text-amber-400">
                                {data.dayOfWeek}, {data.fullDate}
                              </span>
                              {data.isToday && (
                                <span className="px-1.5 py-0.2 bg-amber-500 text-gray-900 font-black rounded text-[10px]">
                                  Hôm nay
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Doanh thu:</span>
                                <span className="font-black text-white">{formatCurrency(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Số đơn:</span>
                                <span className="font-bold text-blue-400">{data.orderCount} đơn</span>
                              </div>
                              <div className="flex justify-between text-[11px] pt-1 border-t border-gray-800 text-gray-300">
                                <span>Tiền mặt: {formatCurrency(data.cashRevenue)}</span>
                                <span>QR: {formatCurrency(data.qrRevenue)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 10, fontSize: isMobile ? 11 : 12 }}
                      formatter={(val) => {
                        if (val === 'revenue') return 'Doanh thu (₫)';
                        if (val === 'orderCount') return 'Số đơn hàng';
                        return val;
                      }}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Doanh thu (₫)"
                      fill="#f59e0b"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orderCount"
                      name="Số đơn hàng"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#3b82f6' }}
                    />
                  </ComposedChart>
                ) : chartView === 'revenue' ? (
                  <BarChart
                    data={chartData}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        setSelectedDayKey(state.activePayload[0].payload.dateKey);
                      }
                    }}
                    margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -22 : -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as DailyStat;
                        return (
                          <div className="bg-gray-900/95 backdrop-blur-sm text-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-gray-700 text-xs min-w-[180px] sm:min-w-[190px]">
                            <p className="font-bold text-amber-400 mb-1.5 border-b border-gray-700 pb-1">
                              {data.dayOfWeek}, {data.fullDate}
                            </p>
                            <p className="flex justify-between py-0.5">
                              <span className="text-gray-400">Tiền mặt:</span>
                              <span className="font-bold text-amber-300">{formatCurrency(data.cashRevenue)}</span>
                            </p>
                            <p className="flex justify-between py-0.5">
                              <span className="text-gray-400">QR:</span>
                              <span className="font-bold text-emerald-400">{formatCurrency(data.qrRevenue)}</span>
                            </p>
                            <p className="flex justify-between pt-1 mt-1 border-t border-gray-800 font-black">
                              <span>Tổng:</span>
                              <span className="text-white">{formatCurrency(data.revenue)}</span>
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 10, fontSize: isMobile ? 11 : 12 }}
                      formatter={(val) => (val === 'cashRevenue' ? 'Tiền mặt' : 'QR Chuyển khoản')}
                    />
                    <Bar dataKey="cashRevenue" name="cashRevenue" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={45} />
                    <Bar dataKey="qrRevenue" name="qrRevenue" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                ) : (
                  <BarChart
                    data={chartData}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        setSelectedDayKey(state.activePayload[0].payload.dateKey);
                      }
                    }}
                    margin={{ top: 10, right: isMobile ? 5 : 10, left: isMobile ? -22 : -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as DailyStat;
                        return (
                          <div className="bg-gray-900/95 backdrop-blur-sm text-white p-2.5 rounded-xl shadow-xl text-xs">
                            <p className="font-bold text-blue-400">{data.dayOfWeek}, {data.fullDate}</p>
                            <p className="font-black text-white mt-1 text-sm">{data.orderCount} đơn hàng</p>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: isMobile ? 11 : 12 }} />
                    <Bar dataKey="orderCount" name="Số đơn hàng" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {chartData.length > 7 && (
            <p className="text-[11px] text-gray-400 text-center sm:hidden mt-1 flex items-center justify-center gap-1 font-medium">
              <span>👉</span>
              <span>Vuốt ngang để xem đủ {chartData.length} ngày</span>
              <span>👈</span>
            </p>
          )}
        </div>

        {/* Top 5 Best-Selling Items Chart using Recharts */}
        <div className="bg-white p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xs border border-gray-200/80">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                  <Flame size={18} />
                </div>
                <h3 className="text-sm sm:text-lg font-black text-gray-800">
                  Top 5 món bán chạy nhất
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {topSellingData.hasData
                  ? `Từ ${topSellingData.ordersCount} đơn hoàn tất (${topSellingData.totalQty} phần đã bán)`
                  : 'Thống kê theo đơn hàng đã hoàn tất'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              {/* Scope filter if rangeDays > 0 */}
              {rangeDays > 0 && (
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setTopScope('all')}
                    className={`flex-1 sm:flex-initial text-center px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[32px] flex items-center justify-center ${
                      topScope === 'all'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Toàn thời gian
                  </button>
                  <button
                    onClick={() => setTopScope('period')}
                    className={`flex-1 sm:flex-initial text-center px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[32px] flex items-center justify-center ${
                      topScope === 'period'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {rangeDays} ngày gần nhất
                  </button>
                </div>
              )}

              {/* Metric Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setTopSortBy('quantity')}
                  className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[32px] flex items-center justify-center ${
                    topSortBy === 'quantity'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Theo số lượng
                </button>
                <button
                  onClick={() => setTopSortBy('revenue')}
                  className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[32px] flex items-center justify-center ${
                    topSortBy === 'revenue'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Theo doanh thu
                </button>
              </div>
            </div>
          </div>

          {!topSellingData.hasData ? (
            <div className="py-10 text-center text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Flame size={24} />
              </div>
              <p className="font-bold text-gray-700 text-sm">Chưa có dữ liệu món từ đơn hàng hoàn tất</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Khi các đơn hàng được phục vụ và hoàn tất, biểu đồ sẽ tự động hiển thị 5 món bán chạy nhất.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-center">
              {/* Recharts BarChart */}
              <div className="lg:col-span-7 h-60 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topSellingData.top5}
                    margin={{ top: 5, right: isMobile ? 15 : 30, left: isMobile ? -10 : 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                      tickFormatter={(val) => topSortBy === 'revenue' ? `${(val / 1000).toLocaleString()}k` : `${val}`}
                    />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      width={isMobile ? 100 : 125}
                      tick={{ fontSize: isMobile ? 10 : 11, fill: '#334155', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as TopSellingItem;
                        return (
                          <div className="bg-gray-900/95 backdrop-blur-sm text-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-gray-700 text-xs min-w-[190px] sm:min-w-[210px]">
                            <div className="flex items-center justify-between border-b border-gray-700/80 pb-1.5 mb-2">
                              <span className="font-bold text-amber-400 truncate mr-1">
                                #{data.rank} - {data.name}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold shrink-0">
                                {data.category}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Số lượng:</span>
                                <span className="font-black text-white">{data.quantity} phần</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Doanh thu:</span>
                                <span className="font-bold text-emerald-400">{formatCurrency(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between text-[11px] pt-1 border-t border-gray-800 text-gray-400">
                                <span>Tỷ trọng:</span>
                                <span className="text-amber-300 font-bold">{data.percentQty}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey={topSortBy === 'revenue' ? 'revenue' : 'quantity'}
                      name={topSortBy === 'revenue' ? 'Doanh thu (₫)' : 'Số lượng bán (phần)'}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={24}
                    >
                      {topSellingData.top5.map((_, index) => (
                        <Cell key={`top-cell-${index}`} fill={TOP_RANK_COLORS[index % TOP_RANK_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Leaderboard Detail List */}
              <div className="lg:col-span-5 space-y-1.5 sm:space-y-2">
                {topSellingData.top5.map((item, idx) => {
                  const color = TOP_RANK_COLORS[idx % TOP_RANK_COLORS.length];
                  return (
                    <div
                      key={item.id || idx}
                      className="p-2.5 sm:p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: color }}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
                            <span className="truncate">{item.category}</span>
                            <span>•</span>
                            <span className="shrink-0">{item.percentQty}% sản lượng</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-black text-gray-900 text-xs sm:text-sm">
                          {item.quantity} <span className="font-medium text-[10px] sm:text-[11px] text-gray-500">phần</span>
                        </p>
                        <p className="text-[10px] sm:text-[11px] font-bold text-emerald-600">
                          {formatCurrency(item.revenue)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Breakdown Table & Mobile Cards */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div className="p-3.5 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-700 shrink-0">
                <Layers size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-gray-800">Bảng tổng hợp theo ngày</h3>
                <p className="text-[11px] sm:text-xs text-gray-400">Doanh thu, cơ cấu thanh toán và trung bình mỗi đơn</p>
              </div>
            </div>

            {selectedDayKey !== 'all' && (
              <button
                onClick={() => setSelectedDayKey('all')}
                className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition-colors self-start sm:self-auto min-h-[34px] flex items-center"
              >
                ✕ Bỏ lọc ngày (Xem tất cả)
              </button>
            )}
          </div>

          {/* Mobile View: Cards list (sm:hidden) */}
          <div className="sm:hidden divide-y divide-gray-100">
            {chartData
              .slice()
              .reverse()
              .filter(d => d.revenue > 0 || d.isToday)
              .map((item) => {
                const isSelected = selectedDayKey === item.dateKey;
                const isTopDay = bestDay && bestDay.dateKey === item.dateKey && item.revenue > 0;

                return (
                  <div
                    key={`mob-day-${item.dateKey}`}
                    onClick={() => setSelectedDayKey(isSelected ? 'all' : item.dateKey)}
                    className={`p-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-amber-50/70 border-l-4 border-amber-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-900 text-sm">{item.fullDate}</span>
                        <span className="text-gray-400 text-xs">({item.dayOfWeek})</span>
                        {item.isToday && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                            Hôm nay
                          </span>
                        )}
                        {item.isYesterday && (
                          <span className="px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                            Hôm qua
                          </span>
                        )}
                        {isTopDay && (
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black inline-flex items-center gap-0.5">
                            <Award size={10} />
                            Cao nhất
                          </span>
                        )}
                      </div>
                      <span className="font-black text-amber-600 text-base shrink-0">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>

                    {/* Micro grid of 3 stats */}
                    <div className="grid grid-cols-3 gap-1.5 bg-gray-50/90 p-2 rounded-xl text-center text-xs mb-2 border border-gray-100">
                      <div>
                        <span className="text-[10px] text-gray-400 block">Số đơn</span>
                        <span className="font-black text-gray-800">{item.orderCount} đơn</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">Tiền mặt</span>
                        <span className="font-bold text-gray-700">{formatCurrency(item.cashRevenue)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block">QR</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(item.qrRevenue)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-xs">
                      <span className="text-[11px] text-gray-400">
                        TB/đơn: <strong className="text-gray-700 font-semibold">{formatCurrency(item.avgOrderValue)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayKey(isSelected ? 'all' : item.dateKey);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all min-h-[30px] flex items-center ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {isSelected ? 'Đang lọc ngày này' : 'Lọc đơn'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Desktop View: Standard Table (hidden sm:block) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                  <th className="p-3 sm:p-4">Ngày</th>
                  <th className="p-3 sm:p-4 text-center">Số đơn</th>
                  <th className="p-3 sm:p-4 text-right">Tiền mặt</th>
                  <th className="p-3 sm:p-4 text-right">QR Chuyển khoản</th>
                  <th className="p-3 sm:p-4 text-right">TB / đơn</th>
                  <th className="p-3 sm:p-4 text-right">Tổng doanh thu</th>
                  <th className="p-3 sm:p-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chartData
                  .slice()
                  .reverse()
                  .filter(d => d.revenue > 0 || d.isToday)
                  .map((item) => {
                    const isSelected = selectedDayKey === item.dateKey;
                    const isTopDay = bestDay && bestDay.dateKey === item.dateKey && item.revenue > 0;

                    return (
                      <tr
                        key={item.dateKey}
                        onClick={() => setSelectedDayKey(isSelected ? 'all' : item.dateKey)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-amber-50/80 font-semibold'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{item.fullDate}</span>
                            <span className="text-gray-400 text-[11px]">({item.dayOfWeek})</span>
                            {item.isToday && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black">
                                Hôm nay
                              </span>
                            )}
                            {item.isYesterday && (
                              <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                                Hôm qua
                              </span>
                            )}
                            {isTopDay && (
                              <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black inline-flex items-center gap-0.5">
                                <Award size={10} />
                                Cao nhất
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 sm:p-4 text-center">
                          <span className="font-black text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md text-xs">
                            {item.orderCount}
                          </span>
                        </td>

                        <td className="p-3 sm:p-4 text-right text-gray-600">
                          {formatCurrency(item.cashRevenue)}
                        </td>

                        <td className="p-3 sm:p-4 text-right text-emerald-600 font-semibold">
                          {formatCurrency(item.qrRevenue)}
                        </td>

                        <td className="p-3 sm:p-4 text-right text-gray-500">
                          {formatCurrency(item.avgOrderValue)}
                        </td>

                        <td className="p-3 sm:p-4 text-right font-black text-amber-600 text-sm sm:text-base">
                          {formatCurrency(item.revenue)}
                        </td>

                        <td className="p-3 sm:p-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDayKey(isSelected ? 'all' : item.dateKey);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected ? 'Đang lọc' : 'Lọc đơn'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Orders History */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div className="p-3.5 sm:p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gray-100 rounded-xl text-gray-600 shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="text-sm sm:text-xl font-bold text-gray-800">
                  Danh sách đơn hàng
                  {selectedDayKey !== 'all' && (
                    <span className="text-amber-600 ml-1.5 text-xs sm:text-sm font-normal">
                      (Ngày {selectedDayKey})
                    </span>
                  )}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-400">
                  {displayedOrders.length} đơn hàng được hiển thị
                </p>
              </div>
            </div>

            {/* Filter Buttons - Responsive on mobile */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto scrollbar-none">
              <button
                onClick={() => setFilterStatus('completed')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap min-h-[36px] flex items-center justify-center transition-all ${
                  filterStatus === 'completed'
                    ? 'bg-white text-green-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Đã thu ({completedOrders.length})
              </button>

              <button
                onClick={() => setFilterStatus('active')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap min-h-[36px] flex items-center justify-center transition-all ${
                  filterStatus === 'active'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Đang chờ ({activeOrders.length})
              </button>

              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-xs font-bold whitespace-nowrap min-h-[36px] flex items-center justify-center transition-all ${
                  filterStatus === 'all'
                    ? 'bg-white text-gray-800 shadow-xs'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Tất cả ({orders.length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {displayedOrders.length === 0 ? (
              <div className="p-10 sm:p-16 flex flex-col items-center justify-center text-gray-400 space-y-2">
                <Package size={36} className="text-gray-300" />
                <p className="text-sm sm:text-base font-medium">Không tìm thấy đơn hàng nào trong ngày này</p>
                {selectedDayKey !== 'all' && (
                  <button
                    onClick={() => setSelectedDayKey('all')}
                    className="text-xs text-amber-600 font-bold hover:underline mt-1"
                  >
                    Xem tất cả các ngày
                  </button>
                )}
              </div>
            ) : (
              displayedOrders.map(order => {
                const isPaid = order.status === 'completed';
                const isReady = order.status === 'ready';

                return (
                  <div
                    key={order.id}
                    className="p-3 sm:p-5 md:p-6 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-mono text-xs font-bold bg-gray-900 text-white px-2 py-0.5 rounded-md">
                          #{order.id.slice(-4).toUpperCase()}
                        </span>
                        
                        <span className="font-black text-gray-800 text-xs sm:text-base">
                          {order.customerName || order.table || 'Khách mang về'}
                        </span>

                        {isPaid && (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} />
                            <span>Đã thu tiền</span>
                          </span>
                        )}

                        {isReady && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full">
                            <span>Làm xong - Chờ thu</span>
                          </span>
                        )}

                        {order.status === 'in_kitchen' && (
                          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full">
                            <Clock size={12} />
                            <span>Trong bếp</span>
                          </span>
                        )}

                        {order.paymentMethod && (
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md">
                            {order.paymentMethod === 'cash' ? <DollarSign size={11} /> : <QrCode size={11} />}
                            <span>{order.paymentMethod === 'cash' ? 'Tiền mặt' : 'QR'}</span>
                          </span>
                        )}

                        <span className="text-gray-400 text-[10px] sm:text-[11px]">
                          {new Date(order.completedAt || order.timestamp).toLocaleString('vi-VN', {
                            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Items badge list with customization tags */}
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item, idx) => {
                          const optSummary = [
                            item.options?.milkTemp,
                            item.options?.sweetener,
                            item.options?.sweetness
                          ].filter(Boolean).join(', ');

                          return (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-800 text-[11px] px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1"
                            >
                              <strong className="text-amber-700">{item.quantity}x</strong>
                              <span>{item.name}</span>
                              {optSummary && (
                                <span className="text-gray-500 font-normal">({optSummary})</span>
                              )}
                              {item.itemNote && (
                                <span className="text-amber-800 font-normal italic">[{item.itemNote}]</span>
                              )}
                            </span>
                          );
                        })}
                      </div>

                      {order.note && (
                        <p className="text-xs text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded inline-block">
                          Ghi chú: {order.note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      <span className="text-xs text-gray-400 md:hidden">Tổng tiền:</span>
                      <span className="text-base sm:text-xl font-black text-amber-600">
                        {formatCurrency(order.total)}
                      </span>
                      {order.createdByName && (
                        <span className="text-[10px] text-gray-400">
                          Tạo bởi: {order.createdByName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

