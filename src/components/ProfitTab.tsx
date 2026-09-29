import React, { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Order, IngredientExpense, AppUser } from '../types';
import { formatCurrency } from '../data';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Plus,
  Trash2,
  Edit3,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Receipt,
  Coins,
  BarChart3,
  Percent,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  PieChart,
  Tag,
  Clock,
  Printer
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
  Cell
} from 'recharts';

interface ProfitTabProps {
  orders: Order[];
  expenses: IngredientExpense[];
  currentUser: AppUser | null;
  onAddExpense: (expense: Omit<IngredientExpense, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateExpense: (id: string, expense: Partial<IngredientExpense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

const INGREDIENT_CATEGORIES = [
  'Cà phê',
  'Trà & Matcha',
  'Sữa & Kem béo',
  'Đường, Siro & Topping',
  'Bao bì (Ly, nắp, túi)',
  'Trái cây tươi',
  'Đá viên & Nước',
  'Khác'
];

const COMMON_INGREDIENTS = [
  { name: 'Hạt cà phê Robusta/Arabica', category: 'Cà phê' },
  { name: 'Bột Matcha Uji', category: 'Trà & Matcha' },
  { name: 'Sữa tươi DalatMilk / Vinamilk', category: 'Sữa & Kem béo' },
  { name: 'Sữa đặc Ngôi Sao / Phương Nam', category: 'Sữa & Kem béo' },
  { name: 'Kem béo thực vật Rich', category: 'Sữa & Kem béo' },
  { name: 'Đường cát Biên Hòa', category: 'Đường, Siro & Topping' },
  { name: 'Siro Đào / Vải / Caramel', category: 'Đường, Siro & Topping' },
  { name: 'Trân châu & Thạch', category: 'Đường, Siro & Topping' },
  { name: 'Trà Ô Long / Trà đen', category: 'Trà & Matcha' },
  { name: 'Ly nhựa, nắp cầu & ống hút', category: 'Bao bì (Ly, nắp, túi)' },
  { name: 'Túi đựng mang về & quai xách', category: 'Bao bì (Ly, nắp, túi)' },
  { name: 'Cam sành / Đào hộp', category: 'Trái cây tươi' },
  { name: 'Đá viên sạch', category: 'Đá viên & Nước' }
];

export default function ProfitTab({
  orders,
  expenses,
  currentUser,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}: ProfitTabProps) {
  // Current month key in format "YYYY-MM"
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(currentMonthKey);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<IngredientExpense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Search & Filter within the selected month
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'detail' | 'comparison'>('detail');

  // Form states for adding/editing expense
  const [formDate, setFormDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [formName, setFormName] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('Cà phê');
  const [formSupplier, setFormSupplier] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Extract Year and Month from selectedMonthKey
  const [selectedYear, selectedMonth] = useMemo(() => {
    const parts = selectedMonthKey.split('-');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
  }, [selectedMonthKey]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setSelectedMonthKey(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // Navigate to next month
  const handleNextMonth = () => {
    let newYear = selectedYear;
    let newMonth = selectedMonth + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setSelectedMonthKey(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  // Completed orders only
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);

  // Calculate Monthly Revenue: Sum of completed orders in this month
  const monthlyRevenue = useMemo(() => {
    return completedOrders.reduce((sum, order) => {
      const time = order.completedAt || order.timestamp;
      const d = new Date(time);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (mKey === selectedMonthKey) {
        return sum + order.total;
      }
      return sum;
    }, 0);
  }, [completedOrders, selectedMonthKey]);

  // Monthly completed orders count
  const monthlyOrderCount = useMemo(() => {
    return completedOrders.filter(order => {
      const time = order.completedAt || order.timestamp;
      const d = new Date(time);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mKey === selectedMonthKey;
    }).length;
  }, [completedOrders, selectedMonthKey]);

  // Expenses for the selected month
  const monthlyExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Check monthKey if exists, or compute from exp.date
      const mKey = exp.monthKey || exp.date.substring(0, 7);
      return mKey === selectedMonthKey;
    });
  }, [expenses, selectedMonthKey]);

  // Total ingredient costs in this month
  const totalIngredientCost = useMemo(() => {
    return monthlyExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [monthlyExpenses]);

  // Net Profit = Monthly Revenue - Total Ingredient Cost
  const netProfit = monthlyRevenue - totalIngredientCost;

  // Profit Margin (%) = (Net Profit / Monthly Revenue) * 100
  const profitMargin = useMemo(() => {
    if (monthlyRevenue <= 0) return 0;
    return Math.round((netProfit / monthlyRevenue) * 100);
  }, [netProfit, monthlyRevenue]);

  // Cost Ratio (%) = (Ingredient Cost / Monthly Revenue) * 100
  const costRatio = useMemo(() => {
    if (monthlyRevenue <= 0) return totalIngredientCost > 0 ? 100 : 0;
    return Math.round((totalIngredientCost / monthlyRevenue) * 100);
  }, [totalIngredientCost, monthlyRevenue]);

  // Previous Month's Stats for growth comparison
  const prevMonthKey = useMemo(() => {
    let y = selectedYear;
    let m = selectedMonth - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    return `${y}-${String(m).padStart(2, '0')}`;
  }, [selectedYear, selectedMonth]);

  const prevMonthStats = useMemo(() => {
    const prevRev = completedOrders.reduce((sum, order) => {
      const time = order.completedAt || order.timestamp;
      const d = new Date(time);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return mKey === prevMonthKey ? sum + order.total : sum;
    }, 0);

    const prevCost = expenses.reduce((sum, exp) => {
      const mKey = exp.monthKey || exp.date.substring(0, 7);
      return mKey === prevMonthKey ? sum + (exp.amount || 0) : sum;
    }, 0);

    const prevProfit = prevRev - prevCost;
    return { revenue: prevRev, cost: prevCost, profit: prevProfit };
  }, [completedOrders, expenses, prevMonthKey]);

  // Growth rates compared to previous month
  const profitGrowth = useMemo(() => {
    if (prevMonthStats.profit === 0) return netProfit > 0 ? 100 : 0;
    return Math.round(((netProfit - prevMonthStats.profit) / Math.abs(prevMonthStats.profit)) * 100);
  }, [netProfit, prevMonthStats.profit]);

  // Category breakdown of ingredient expenses for the current month
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthlyExpenses.forEach(exp => {
      const cat = exp.category || 'Khác';
      map.set(cat, (map.get(cat) || 0) + exp.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent: totalIngredientCost > 0 ? Math.round((amount / totalIngredientCost) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthlyExpenses, totalIngredientCost]);

  // Filtered expenses list for display in the table
  const filteredExpenses = useMemo(() => {
    return monthlyExpenses.filter(exp => {
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = exp.name.toLowerCase().includes(query);
        const matchNote = exp.note?.toLowerCase().includes(query);
        const matchSupplier = exp.supplier?.toLowerCase().includes(query);
        if (!matchName && !matchNote && !matchSupplier) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort newest date first
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [monthlyExpenses, selectedCategory, searchQuery]);

  // Multi-month comparison dataset for bar charts (last 6 months or full year)
  const multiMonthData = useMemo(() => {
    const list = [];
    // Generate 6 consecutive months leading up to the selected month (or current)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mKey = `${y}-${String(m).padStart(2, '0')}`;
      const label = `T${m}/${y}`;

      const rev = completedOrders.reduce((sum, order) => {
        const time = order.completedAt || order.timestamp;
        const od = new Date(time);
        const ok = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, '0')}`;
        return ok === mKey ? sum + order.total : sum;
      }, 0);

      const cost = expenses.reduce((sum, exp) => {
        const ek = exp.monthKey || exp.date.substring(0, 7);
        return ek === mKey ? sum + (exp.amount || 0) : sum;
      }, 0);

      const profit = rev - cost;
      const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;

      list.push({
        monthKey: mKey,
        label,
        revenue: rev,
        cost,
        profit,
        margin,
        isSelected: mKey === selectedMonthKey
      });
    }
    return list;
  }, [selectedYear, selectedMonth, selectedMonthKey, completedOrders, expenses]);

  // Reset form
  const resetForm = () => {
    const today = new Date();
    // Default form date to today if currently viewing this month, or the 1st of selected month
    if (selectedMonthKey === currentMonthKey) {
      setFormDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    } else {
      setFormDate(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`);
    }
    setFormName('');
    setFormAmount('');
    setFormCategory('Cà phê');
    setFormSupplier('');
    setFormNote('');
    setFormError('');
    setEditingExpense(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (exp: IngredientExpense) => {
    setEditingExpense(exp);
    setFormDate(exp.date);
    setFormName(exp.name);
    setFormAmount(exp.amount.toString());
    setFormCategory(exp.category || 'Khác');
    setFormSupplier(exp.supplier || '');
    setFormNote(exp.note || '');
    setFormError('');
    setShowAddModal(true);
  };

  // Submit expense form
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên nguyên liệu hoặc hàng hoá.');
      return;
    }
    const cleanAmount = parseFloat(formAmount.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setFormError('Vui lòng nhập số tiền chi mua hợp lệ (> 0 đ).');
      return;
    }
    if (!formDate) {
      setFormError('Vui lòng chọn ngày mua nguyên liệu.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const monthKey = formDate.substring(0, 7); // e.g. "2026-09"
      if (editingExpense) {
        await onUpdateExpense(editingExpense.id, {
          name: formName.trim(),
          amount: Math.round(cleanAmount),
          date: formDate,
          monthKey,
          category: formCategory,
          supplier: formSupplier.trim() || undefined,
          note: formNote.trim() || undefined
        });
      } else {
        await onAddExpense({
          name: formName.trim(),
          amount: Math.round(cleanAmount),
          date: formDate,
          monthKey,
          category: formCategory,
          supplier: formSupplier.trim() || undefined,
          note: formNote.trim() || undefined,
          createdBy: currentUser?.uid,
          createdByName: currentUser?.displayName || currentUser?.username || 'Quản lý'
        });
      }

      // If user added expense in a different month, switch to that month so they see it
      if (monthKey !== selectedMonthKey) {
        setSelectedMonthKey(monthKey);
      }

      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || 'Không thể lưu chi phí. Vui lòng thử lại.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Quick increment amounts
  const addQuickAmount = (val: number) => {
    const current = parseFloat(formAmount.replace(/[^0-9.]/g, '')) || 0;
    setFormAmount((current + val).toString());
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      await onDeleteExpense(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete expense error:', err);
    }
  };

  return (
    <div className="p-2.5 sm:p-5 lg:p-8 bg-[#faf8f5] h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-28 sm:pb-20">

        {/* Header with Title and Month Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-3xl border border-[#e6d5c2] shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#f3eae0] text-[#54331e] uppercase tracking-wide flex items-center gap-1">
                <Coins size={12} />
                Tính theo từng tháng
              </span>
              <span className="text-[11px] font-semibold text-[#8c7460] hidden sm:inline">
                • Trừ tiền mua nguyên liệu vào doanh thu
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#25150c] tracking-tight mt-1 flex items-center gap-2">
              <span>Báo cáo Lợi nhuận</span>
              <span className="text-sm sm:text-base font-bold text-[#7c5434] bg-[#faf6f1] px-3 py-1 rounded-2xl border border-[#e6d5c2]">
                Tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[#7c6957] mt-0.5">
              Hệ thống tự động tổng hợp doanh thu và trừ tiền mua nguyên liệu để tính lợi nhuận ròng của từng tháng.
            </p>
          </div>

          {/* Month Selector Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Prev / Next Month Navigator */}
            <div className="flex items-center bg-[#faf6f1] p-1 rounded-2xl border border-[#e6d5c2] shadow-2xs">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white text-[#54331e] rounded-xl transition-all"
                title="Tháng trước"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="px-3 py-1 text-center min-w-[110px]">
                <span className="block text-xs font-black text-[#25150c]">
                  T{String(selectedMonth).padStart(2, '0')} / {selectedYear}
                </span>
                {selectedMonthKey === currentMonthKey && (
                  <span className="inline-block text-[9.5px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                    Tháng này
                  </span>
                )}
              </div>

              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white text-[#54331e] rounded-xl transition-all"
                title="Tháng sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Quick Button to Jump to Current Month */}
            {selectedMonthKey !== currentMonthKey && (
              <button
                onClick={() => setSelectedMonthKey(currentMonthKey)}
                className="px-3 py-2 bg-white text-[#54331e] hover:bg-[#faf6f1] border border-[#e6d5c2] rounded-2xl text-xs font-bold transition-all shadow-2xs"
              >
                Về tháng này
              </button>
            )}

            {/* Main Action: Add Expense */}
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#54331e] hover:bg-[#402616] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-[#54331e]/20 transition-all ml-auto md:ml-0"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Nhập tiền nguyên liệu</span>
            </button>
          </div>
        </div>

        {/* 4 Core Metric Cards (Auto calculated for selected month) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          
          {/* Card 1: Doanh thu tháng (A) */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-[#e6d5c2] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#8c7460] font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                1. Doanh thu tháng
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#faf6f1] text-[#7c5434] flex items-center justify-center shrink-0">
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-black text-[#25150c] truncate">
                {formatCurrency(monthlyRevenue)}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] text-[#7c6957]">
                <span className="font-bold text-[#54331e]">{monthlyOrderCount} đơn</span>
                <span>hoàn tất trong tháng</span>
              </div>
            </div>
          </div>

          {/* Card 2: Tiền mua nguyên liệu (B) */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-[#e6d5c2] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#8c7460] font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                2. Tiền nguyên liệu
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-2xl font-black text-amber-900 truncate">
                {formatCurrency(totalIngredientCost)}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] text-[#7c6957]">
                <span className="font-bold text-amber-800">{monthlyExpenses.length} lần nhập</span>
                <span>• Chiếm {costRatio}% doanh thu</span>
              </div>
            </div>
          </div>

          {/* Card 3: LỢI NHUẬN RÒNG (C = A - B) */}
          <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border flex flex-col justify-between transition-all ${
            netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 border-emerald-300'
              : 'bg-gradient-to-br from-rose-50/90 to-rose-100/40 border-rose-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 ${
                netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                <span>3. Lợi nhuận ròng</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                  netProfit >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                }`}>
                  {netProfit >= 0 ? 'LÃI' : 'LỖ'}
                </span>
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              </div>
            </div>
            <div>
              <h3 className={`text-base sm:text-2xl font-black truncate ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {formatCurrency(netProfit)}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#554334] mt-1 flex items-center gap-1 font-semibold truncate">
                <span>(Doanh thu - Nguyên liệu)</span>
              </p>
            </div>
          </div>

          {/* Card 4: Tỷ suất lợi nhuận (%) */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs border border-[#e6d5c2] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#8c7460] font-bold text-[10px] sm:text-xs uppercase tracking-wider">
                4. Tỷ suất sinh lời
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Percent size={16} />
              </div>
            </div>
            <div>
              <h3 className={`text-base sm:text-2xl font-black truncate ${
                profitMargin >= 40 ? 'text-emerald-700' : profitMargin >= 0 ? 'text-blue-700' : 'text-rose-700'
              }`}>
                {profitMargin}%
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#7c6957] mt-1 truncate">
                {profitMargin >= 40 ? 'Biên lợi nhuận rất tốt' : profitMargin > 0 ? 'Biên lợi nhuận ổn định' : 'Chưa có lợi nhuận'}
              </p>
            </div>
          </div>

        </div>

        {/* View Mode Switcher: Chi tiết tháng vs So sánh các tháng */}
        <div className="flex items-center justify-between gap-3 border-b border-[#e6d5c2] pb-3">
          <div className="flex items-center gap-1 bg-[#faf6f1] p-1 rounded-2xl border border-[#e6d5c2]">
            <button
              onClick={() => setViewMode('detail')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'detail'
                  ? 'bg-[#54331e] text-white shadow-xs'
                  : 'text-[#7c6957] hover:text-[#25150c]'
              }`}
            >
              <Receipt size={14} />
              <span>Chi tiết Tháng {selectedMonth}/{selectedYear}</span>
            </button>
            <button
              onClick={() => setViewMode('comparison')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'comparison'
                  ? 'bg-[#54331e] text-white shadow-xs'
                  : 'text-[#7c6957] hover:text-[#25150c]'
              }`}
            >
              <BarChart3 size={14} />
              <span>Biểu đồ so sánh các tháng</span>
            </button>
          </div>

          <span className="text-xs text-[#8c7460] font-bold hidden sm:inline">
            Tự động trừ vào doanh thu theo tháng
          </span>
        </div>

        {/* MODE 1: DETAIL OF SELECTED MONTH */}
        {viewMode === 'detail' && (
          <div className="space-y-4 sm:space-y-6">

            {/* Quick Profit Formula Banner */}
            <div className="bg-[#faf6f1] p-3.5 sm:p-5 rounded-2xl border border-[#e6d5c2] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#54331e] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Coins size={20} />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-[#25150c]">
                    Công thức tính lợi nhuận Tháng {selectedMonth}/{selectedYear}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                    <span className="font-bold text-[#54331e] bg-white px-2 py-0.5 rounded-lg border border-[#e6d5c2]">
                      Doanh thu: {formatCurrency(monthlyRevenue)}
                    </span>
                    <span className="font-black text-[#8c7460]">-</span>
                    <span className="font-bold text-amber-900 bg-white px-2 py-0.5 rounded-lg border border-[#e6d5c2]">
                      Tiền nguyên liệu: {formatCurrency(totalIngredientCost)}
                    </span>
                    <span className="font-black text-[#8c7460]">=</span>
                    <span className={`font-black px-2 py-0.5 rounded-lg ${
                      netProfit >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      Lợi nhuận: {formatCurrency(netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={openAddModal}
                className="px-3.5 py-2 bg-white hover:bg-[#f3eae0] text-[#54331e] border border-[#e6d5c2] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
              >
                <Plus size={15} />
                <span>+ Thêm hoá đơn nguyên liệu</span>
              </button>
            </div>

            {/* Category Breakdown Chips */}
            {categoryBreakdown.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-[#e6d5c2] shadow-xs">
                <p className="text-xs font-bold text-[#7c6957] mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <PieChart size={13} />
                  <span>Cơ cấu tiền mua nguyên liệu theo danh mục:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {categoryBreakdown.map((item) => (
                    <div
                      key={item.category}
                      className="px-3 py-1.5 rounded-xl bg-[#faf6f1] border border-[#e6d5c2] text-xs font-semibold flex items-center gap-2"
                    >
                      <span className="text-[#342a22] font-bold">{item.category}:</span>
                      <span className="text-amber-900 font-black">{formatCurrency(item.amount)}</span>
                      <span className="text-[10px] bg-[#f3eae0] text-[#54331e] px-1.5 py-0.2 rounded-full font-bold">
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of Ingredient Expenses in this Month */}
            <div className="bg-white rounded-3xl border border-[#e6d5c2] shadow-xs overflow-hidden">
              {/* Table Header / Filter toolbar */}
              <div className="p-3.5 sm:p-5 border-b border-[#f3eae0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#25150c] flex items-center gap-2">
                    <ShoppingBag size={18} className="text-[#7c5434]" />
                    <span>Danh sách tiền mua nguyên liệu (Tháng {selectedMonth}/{selectedYear})</span>
                  </h3>
                  <p className="text-xs text-[#7c6957] mt-0.5">
                    Tổng cộng {monthlyExpenses.length} lần nhập, tổng tiền {formatCurrency(totalIngredientCost)}
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 bg-[#faf6f1] border border-[#e6d5c2] rounded-xl text-xs font-bold text-[#54331e] focus:outline-none focus:ring-2 focus:ring-[#54331e]"
                  >
                    <option value="all">Tất cả danh mục</option>
                    {INGREDIENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Search query */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm nguyên liệu..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-7 pr-3 py-1.5 bg-[#faf6f1] border border-[#e6d5c2] rounded-xl text-xs font-medium text-[#25150c] focus:outline-none focus:ring-2 focus:ring-[#54331e] w-36 sm:w-48"
                    />
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#978370]" />
                  </div>
                </div>
              </div>

              {/* Table Body / Mobile Cards */}
              {filteredExpenses.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#faf6f1] text-[#7c5434] flex items-center justify-center mx-auto mb-3 border border-[#e6d5c2]">
                    <ShoppingBag size={24} />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-[#25150c]">
                    Chưa có khoản chi nguyên liệu nào trong Tháng {selectedMonth}/{selectedYear}
                  </h4>
                  <p className="text-xs text-[#7c6957] mt-1 max-w-md mx-auto">
                    Bấm nút "Nhập tiền nguyên liệu" để nhập chi phí hạt cà phê, sữa, trà, bao bì... Số tiền sẽ tự động trừ vào doanh thu của tháng này.
                  </p>
                  <button
                    onClick={openAddModal}
                    className="mt-4 px-4 py-2 bg-[#54331e] text-white rounded-2xl text-xs font-bold hover:bg-[#402616] transition-all inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={15} />
                    <span>+ Nhập tiền nguyên liệu ngay</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-[#faf6f1] border-b border-[#e6d5c2] text-[#7c5434] text-[11px] uppercase tracking-wider font-extrabold">
                      <tr>
                        <th className="py-3 px-3 sm:px-4">Ngày mua</th>
                        <th className="py-3 px-3 sm:px-4">Tên nguyên liệu / Hàng hoá</th>
                        <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Phân loại</th>
                        <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Nơi mua / Ghi chú</th>
                        <th className="py-3 px-3 sm:px-4 text-right">Số tiền (VNĐ)</th>
                        <th className="py-3 px-3 sm:px-4 text-center w-20">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f3eae0]">
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-[#faf6f1]/60 transition-colors">
                          <td className="py-3 px-3 sm:px-4 font-bold text-[#25150c] whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Calendar size={13} className="text-[#8c7460]" />
                              {exp.date.split('-').reverse().join('/')}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <p className="font-bold text-[#25150c]">{exp.name}</p>
                            <p className="text-[11px] text-[#7c6957] sm:hidden flex items-center gap-1 mt-0.5">
                              <span className="bg-[#f3eae0] px-1.5 py-0.2 rounded text-[10px] font-bold text-[#54331e]">
                                {exp.category || 'Khác'}
                              </span>
                              {exp.supplier && <span>• {exp.supplier}</span>}
                            </p>
                          </td>
                          <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#f3eae0] text-[#54331e] inline-block">
                              {exp.category || 'Khác'}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4 hidden md:table-cell text-xs text-[#7c6957]">
                            {exp.supplier && <p className="font-semibold text-[#342a22]">Nơi mua: {exp.supplier}</p>}
                            {exp.note && <p className="italic text-[11px]">{exp.note}</p>}
                            {!exp.supplier && !exp.note && <span className="text-[#bba998]">-</span>}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-right font-black text-amber-900 text-sm sm:text-base whitespace-nowrap">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(exp)}
                                className="p-1.5 text-[#7c5434] hover:bg-[#f3eae0] rounded-lg transition-colors"
                                title="Sửa chi phí"
                              >
                                <Edit3 size={15} />
                              </button>
                              
                              {deleteConfirmId === exp.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(exp.id)}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold"
                                    title="Xác nhận xoá"
                                  >
                                    Xoá
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                    title="Huỷ"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(exp.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Xoá chi phí"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#faf6f1] font-bold border-t border-[#e6d5c2]">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 sm:px-4 text-[#25150c]">
                          Tổng tiền nguyên liệu đã lọc ({filteredExpenses.length} mục)
                        </td>
                        <td className="hidden md:table-cell"></td>
                        <td className="py-3 px-3 sm:px-4 text-right font-black text-amber-900 text-sm sm:text-base">
                          {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* MODE 2: MULTI-MONTH COMPARISON & TRENDS */}
        {viewMode === 'comparison' && (
          <div className="space-y-4 sm:space-y-6">
            
            {/* Chart: Revenue vs Cost vs Profit across months */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#e6d5c2] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#25150c] flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#54331e]" />
                    <span>Biểu đồ so sánh Doanh thu - Chi phí - Lợi nhuận qua các tháng</span>
                  </h3>
                  <p className="text-xs text-[#7c6957] mt-0.5">
                    Chỉ tính theo từng tháng, nhấn vào cột tháng để chọn tháng đó
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#54331e]"></span>
                    <span className="text-[#342a22]">Doanh thu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-amber-600"></span>
                    <span className="text-[#342a22]">Tiền nguyên liệu</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <span className="text-[#342a22]">Lợi nhuận ròng</span>
                  </div>
                </div>
              </div>

              <div className="h-64 sm:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={multiMonthData}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        setSelectedMonthKey(state.activePayload[0].payload.monthKey);
                        setViewMode('detail');
                      }
                    }}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3eae0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#7c6957', fontWeight: 600 }}
                      axisLine={{ stroke: '#e6d5c2' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                      tick={{ fontSize: 11, fill: '#7c6957' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#25150c] text-white p-3 rounded-2xl shadow-xl border border-[#54331e] text-xs min-w-[200px]">
                            <p className="font-black text-[#f3eae0] border-b border-[#54331e] pb-1 mb-2">
                              Tháng {data.monthKey}
                            </p>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-[#c4b3a3]">Doanh thu:</span>
                                <span className="font-bold text-white">{formatCurrency(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#c4b3a3]">Tiền nguyên liệu:</span>
                                <span className="font-bold text-amber-400">{formatCurrency(data.cost)}</span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-[#3d2415] font-black">
                                <span className="text-white">Lợi nhuận ròng:</span>
                                <span className={data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {formatCurrency(data.profit)}
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-[#c4b3a3]">
                                <span>Biên lợi nhuận:</span>
                                <span className="font-bold text-blue-300">{data.margin}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Doanh thu" fill="#54331e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="cost" name="Tiền nguyên liệu" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="profit" name="Lợi nhuận ròng" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Profit Summary Table */}
            <div className="bg-white rounded-3xl border border-[#e6d5c2] shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-[#f3eae0]">
                <h3 className="text-base sm:text-lg font-black text-[#25150c]">
                  Bảng tổng hợp lợi nhuận từng tháng
                </h3>
                <p className="text-xs text-[#7c6957] mt-0.5">
                  Bấm "Xem chi tiết" để xem và quản lý hoá đơn nguyên liệu của tháng tương ứng
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#faf6f1] text-[#7c5434] text-[11px] uppercase tracking-wider font-extrabold border-b border-[#e6d5c2]">
                    <tr>
                      <th className="py-3 px-4">Kỳ kế toán</th>
                      <th className="py-3 px-4 text-right">Doanh thu (A)</th>
                      <th className="py-3 px-4 text-right">Tiền nguyên liệu (B)</th>
                      <th className="py-3 px-4 text-right">Lợi nhuận ròng (A - B)</th>
                      <th className="py-3 px-4 text-center">Tỷ suất (%)</th>
                      <th className="py-3 px-4 text-center">Đánh giá</th>
                      <th className="py-3 px-4 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3eae0]">
                    {multiMonthData.map((row) => (
                      <tr
                        key={row.monthKey}
                        className={`transition-colors ${
                          row.isSelected ? 'bg-[#faf6f1] font-bold' : 'hover:bg-[#faf6f1]/60'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-[#25150c]">
                          Tháng {row.monthKey.split('-').reverse().join('/')}
                          {row.monthKey === currentMonthKey && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
                              Hiện tại
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-[#25150c]">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-amber-900">
                          {formatCurrency(row.cost)}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-black text-sm sm:text-base ${
                          row.profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {formatCurrency(row.profit)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          {row.margin}%
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-black uppercase inline-block ${
                            row.profit > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.profit === 0 && row.revenue === 0
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {row.profit > 0 ? 'Có lãi' : row.profit === 0 && row.revenue === 0 ? 'Chưa phát sinh' : 'Lỗ'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedMonthKey(row.monthKey);
                              setViewMode('detail');
                            }}
                            className="px-3 py-1 bg-white hover:bg-[#54331e] hover:text-white text-[#54331e] border border-[#e6d5c2] rounded-xl text-xs font-bold transition-all shadow-2xs"
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: Thêm / Sửa Tiền Mua Nguyên Liệu */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#e6d5c2] max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#f3eae0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#54331e] text-white flex items-center justify-center shrink-0">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#25150c]">
                    {editingExpense ? 'Chỉnh sửa tiền nguyên liệu' : 'Nhập tiền mua nguyên liệu'}
                  </h3>
                  <p className="text-xs text-[#7c6957]">
                    Tự động trừ vào doanh thu Tháng {formDate.substring(5, 7)}/{formDate.substring(0, 4)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-[#978370] hover:text-[#25150c] hover:bg-[#faf6f1] rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2 border border-red-200">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitExpense} className="space-y-3.5">
              
              {/* Row 1: Ngày mua */}
              <div>
                <label className="block text-xs font-bold text-[#54331e] mb-1">
                  Ngày mua / Ngày ghi nhận *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#faf6f1] border border-[#e6d5c2] rounded-2xl text-sm font-semibold text-[#25150c] focus:outline-none focus:ring-2 focus:ring-[#54331e]"
                />
                <p className="text-[11px] text-[#8c7460] mt-1">
                  Khoản tiền này sẽ được tính vào kỳ kế toán: <span className="font-bold text-[#54331e]">Tháng {formDate.substring(5, 7)}/{formDate.substring(0, 4)}</span>
                </p>
              </div>

              {/* Row 2: Tên nguyên liệu */}
              <div>
                <label className="block text-xs font-bold text-[#54331e] mb-1">
                  Tên nguyên liệu / Hàng hoá *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 5kg Hạt cà phê Robusta, 10 hộp Sữa DalatMilk..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#faf6f1] border border-[#e6d5c2] rounded-2xl text-sm font-bold text-[#25150c] focus:outline-none focus:ring-2 focus:ring-[#54331e]"
                />

                {/* Quick suggestions chips */}
                <div className="mt-2">
                  <p className="text-[10px] font-bold text-[#8c7460] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>Gợi ý nhanh một chạm:</span>
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                    {COMMON_INGREDIENTS.map((item) => (
                      <button
                        type="button"
                        key={item.name}
                        onClick={() => {
                          setFormName(item.name);
                          setFormCategory(item.category);
                        }}
                        className="px-2 py-1 bg-white hover:bg-[#f3eae0] text-[#54331e] border border-[#e6d5c2] rounded-xl text-[11px] font-semibold transition-all"
                      >
                        + {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Số tiền mua (VNĐ) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#54331e]">
                    Số tiền mua nguyên liệu (VNĐ) *
                  </label>
                  {formAmount && !isNaN(parseFloat(formAmount)) && (
                    <span className="text-xs font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      {formatCurrency(parseFloat(formAmount))}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    required
                    placeholder="Nhập số tiền (ví dụ: 500000)"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#faf6f1] border border-[#e6d5c2] rounded-2xl text-base font-black text-[#25150c] focus:outline-none focus:ring-2 focus:ring-[#54331e]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8c7460]">
                    VNĐ
                  </span>
                </div>

                {/* Quick Add Amount Buttons */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => addQuickAmount(50000)}
                    className="px-2 py-1 bg-white hover:bg-[#f3eae0] text-[#54331e] border border-[#e6d5c2] rounded-lg text-xs font-bold"
                  >
                    +50k
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickAmount(100000)}
                    className="px-2 py-1 bg-white hover:bg-[#f3eae0] text-[#54331e] border border-[#e6d5c2] rounded-lg text-xs font-bold"
                  >
                    +100k
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickAmount(200000)}
                    className="px-2 py-1 bg-white hover:bg-[#f3eae0] text-[#54331e] border border-[#e6d5c2] rounded-lg text-xs font-bold"
                  >
                    +200k
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickAmount(500000)}
                    className="px-2 py-1 bg-white hover:bg-[#f3eae0] text-[#54331e] border border-[#e6d5c2] rounded-lg text-xs font-bold"
                  >
                    +500k
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuickAmount(1000000)}
                    className="px-2 py-1 bg-white hover:bg-[#f3eae0] text-[#54331e] border border-[#e6d5c2] rounded-lg text-xs font-bold"
                  >
                    +1tr
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormAmount('')}
                    className="px-2 py-1 text-gray-400 hover:text-red-600 rounded-lg text-xs font-medium ml-auto"
                  >
                    Xoá số
                  </button>
                </div>
              </div>

              {/* Row 4: Phân loại & Nơi mua */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#54331e] mb-1">
                    Phân loại danh mục
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf6f1] border border-[#e6d5c2] rounded-2xl text-xs font-bold text-[#25150c] focus:outline-none focus:ring-2 focus:ring-[#54331e]"
                  >
                    {INGREDIENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#54331e] mb-1">
                    Nơi mua / Nhà cung cấp
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đại lý Vinamilk, Chợ đầu mối..."
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-[#faf6f1] border border-[#e6d5c2] rounded-2xl text-xs font-semibold text-[#25150c] focus:outline-none focus:ring-2 focus:ring-[#54331e]"
                  />
                </div>
              </div>

              {/* Row 5: Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-[#54331e] mb-1">
                  Ghi chú thêm (tuỳ chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ghi chú số lượng, hoá đơn đỏ, chất lượng..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#faf6f1] border border-[#e6d5c2] rounded-2xl text-xs font-medium text-[#25150c] focus:outline-none focus:ring-2 focus:ring-[#54331e]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f3eae0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-[#7c6957] hover:bg-[#faf6f1] rounded-2xl text-xs font-bold transition-all"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-[#54331e] hover:bg-[#402616] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-[#54331e]/20 transition-all disabled:opacity-60 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={16} />
                  <span>{formSubmitting ? 'Đang lưu...' : (editingExpense ? 'Lưu cập nhật' : 'Xác nhận nhập tiền')}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
