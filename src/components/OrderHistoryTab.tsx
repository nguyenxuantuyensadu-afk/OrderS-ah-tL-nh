import { useState, useMemo } from 'react';
import { Order } from '../types';
import { formatCurrency } from '../data';
import { 
  Search, 
  History, 
  Calendar, 
  Clock, 
  Receipt, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Copy, 
  Check, 
  FileText, 
  ArrowUpDown,
  Filter
} from 'lucide-react';

interface OrderHistoryTabProps {
  orders: Order[];
  userRole?: 'admin' | 'staff';
}

export default function OrderHistoryTab({ orders }: OrderHistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'all' | 'custom'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'transfer'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedInfo, setCopiedInfo] = useState(false);

  // Filter completed orders primarily (and allow viewing any archived orders)
  const completedOrders = useMemo(() => {
    return orders.filter(o => o.status === 'completed');
  }, [orders]);

  // Today and yesterday timestamps
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toLocaleDateString('vi-VN');

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return completedOrders.filter(order => {
      const orderDate = new Date(order.completedAt || order.timestamp);
      const orderDateStr = orderDate.toLocaleDateString('vi-VN');
      const orderIsoDateStr = orderDate.toISOString().split('T')[0];

      // Date filtering
      if (dateFilter === 'today' && orderDateStr !== todayStr) {
        return false;
      }
      if (dateFilter === 'yesterday' && orderDateStr !== yesterdayStr) {
        return false;
      }
      if (dateFilter === 'custom' && orderIsoDateStr !== customDate) {
        return false;
      }

      // Payment method filtering
      if (paymentFilter !== 'all' && order.paymentMethod !== paymentFilter) {
        return false;
      }

      // Text search filtering (Order ID, table, customer name, items)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesOrderNum = order.orderNumber?.toString().includes(query);
        const matchesCustomer = order.customerName?.toLowerCase().includes(query);
        const matchesTable = order.table?.toLowerCase().includes(query);
        const matchesItems = order.items.some(i => i.name.toLowerCase().includes(query));

        if (!matchesId && !matchesOrderNum && !matchesCustomer && !matchesTable && !matchesItems) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort newest completed orders first
      const timeA = a.completedAt || a.timestamp;
      const timeB = b.completedAt || b.timestamp;
      return timeB - timeA;
    });
  }, [completedOrders, dateFilter, customDate, paymentFilter, searchTerm, todayStr, yesterdayStr]);

  // Today stats for quick overview
  const todayOrdersCount = completedOrders.filter(o => {
    const d = new Date(o.completedAt || o.timestamp).toLocaleDateString('vi-VN');
    return d === todayStr;
  }).length;

  const handleCopyOrderInfo = (order: Order) => {
    const itemsText = order.items.map(i => {
      const opts = [];
      if (i.options?.sweetness) opts.push(i.options.sweetness);
      if (i.options?.milkTemp) opts.push(i.options.milkTemp);
      if (i.options?.sweetener) opts.push(i.options.sweetener);
      if (i.options?.itemNote) opts.push(i.options.itemNote);
      const optStr = opts.length > 0 ? ` (${opts.join(', ')})` : '';
      return `- ${i.quantity}x ${i.name}${optStr}: ${formatCurrency(i.price * i.quantity)}`;
    }).join('\n');

    const text = `[HÓA ĐƠN ĐỐI SOÁT - POS MINI]\n` +
      `Mã đơn: #${order.id.slice(-4).toUpperCase()} (ID: ${order.id})\n` +
      `Khách/Bàn: ${order.customerName || order.table || 'Mang về'}\n` +
      `Thời gian hoàn tất: ${new Date(order.completedAt || order.timestamp).toLocaleTimeString('vi-VN')} ${new Date(order.completedAt || order.timestamp).toLocaleDateString('vi-VN')}\n` +
      `Hình thức thanh toán: ${order.paymentMethod === 'transfer' ? 'Chuyển khoản QR' : 'Tiền mặt'}\n` +
      `------------------------\n` +
      `${itemsText}\n` +
      `------------------------\n` +
      `TỔNG TIỀN: ${formatCurrency(order.total)}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 2500);
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="bg-white border-b border-gray-200 p-4 sm:p-5 shrink-0 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
              <History size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                Lịch sử & Đối soát đơn hàng
              </h2>
              <p className="text-xs text-gray-500">
                Tra cứu các đơn hàng đã hoàn tất khi khách hàng cần kiểm tra lại món hoặc hóa đơn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-amber-900 font-semibold">
              <Clock size={14} className="text-amber-600" />
              <span>Hôm nay: <strong>{todayOrdersCount}</strong> đơn hoàn tất</span>
            </div>
            <div className="bg-gray-100 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-gray-700 font-medium">
              <span>Tổng lưu trữ: <strong>{completedOrders.length}</strong></span>
            </div>
          </div>
        </div>

        {/* Search Input & Quick Filters */}
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              placeholder="Tìm theo mã đơn (#1234), tên khách, hoặc tên món..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all min-h-[42px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Date Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all min-h-[42px] ${
                dateFilter === 'today'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('yesterday')}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all min-h-[42px] ${
                dateFilter === 'yesterday'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hôm qua
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all min-h-[42px] ${
                dateFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            <div className="relative flex items-center">
              <input
                type="date"
                value={customDate}
                onChange={e => {
                  setCustomDate(e.target.value);
                  setDateFilter('custom');
                }}
                className={`px-2.5 py-2 rounded-xl text-xs font-semibold border outline-none min-h-[42px] ${
                  dateFilter === 'custom'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                    : 'border-gray-200 bg-gray-100 text-gray-600'
                }`}
              />
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setPaymentFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                paymentFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Tất cả PT
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('cash')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                paymentFilter === 'cash' ? 'bg-white text-green-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Banknote size={13} />
              <span>Tiền mặt</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentFilter('transfer')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                paymentFilter === 'transfer' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <CreditCard size={13} />
              <span>Chuyển khoản</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-gray-200 text-gray-500 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
              <Search size={22} />
            </div>
            <p className="font-bold text-gray-700 text-sm">Không tìm thấy đơn hàng nào</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn khoảng thời gian khác để tra cứu.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 font-medium">
              <span>Tìm thấy <strong>{filteredOrders.length}</strong> đơn hàng hoàn tất</span>
              <span>Bấm vào đơn để xem chi tiết đối soát</span>
            </div>

            {/* Order Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredOrders.map(order => {
                const totalItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const orderTime = new Date(order.completedAt || order.timestamp);

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white hover:bg-amber-50/20 border border-gray-200 hover:border-amber-300 rounded-2xl p-4 shadow-2xs transition-all cursor-pointer space-y-3 group"
                  >
                    {/* Card Header: Order Code, Status, Time */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-gray-900 bg-gray-100 group-hover:bg-amber-100 group-hover:text-amber-900 px-2.5 py-1 rounded-xl transition-colors">
                          #{order.id.slice(-4).toUpperCase()}
                        </span>
                        {order.orderNumber && (
                          <span className="text-[11px] font-bold text-gray-500">
                            STT: {order.orderNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={12} />
                          <span>Đã hoàn tất</span>
                        </span>
                      </div>
                    </div>

                    {/* Customer & Timestamp */}
                    <div className="flex items-center justify-between text-xs border-b border-gray-100 pb-2.5">
                      <div className="font-bold text-gray-800 truncate pr-2">
                        {order.customerName || order.table || 'Khách mang về'}
                      </div>
                      <div className="text-gray-400 shrink-0 flex items-center gap-1 font-mono text-[11px]">
                        <Clock size={12} />
                        <span>
                          {orderTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {orderTime.toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="space-y-1 text-xs">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-gray-700">
                          <span className="truncate pr-2">
                            <strong className="text-amber-800 mr-1">{item.quantity}x</strong>
                            <span>{item.name}</span>
                          </span>
                          <span className="font-medium text-gray-500 shrink-0">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-[11px] text-gray-400 italic">
                          +{order.items.length - 3} món khác...
                        </p>
                      )}
                    </div>

                    {/* Bottom: Total & Payment Method & View Action */}
                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {order.paymentMethod === 'transfer' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/60">
                            <CreditCard size={12} />
                            <span>Chuyển khoản</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-green-50 text-green-700 rounded-lg border border-green-200/60">
                            <Banknote size={12} />
                            <span>Tiền mặt</span>
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 font-medium">
                          ({totalItemCount} món)
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-amber-600">
                          {formatCurrency(order.total)}
                        </span>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Order Reconciliation Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Receipt size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-gray-900 text-base">
                      Đơn #{selectedOrder.id.slice(-4).toUpperCase()}
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      ĐÃ HOÀN TẤT
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono">
                    ID: {selectedOrder.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Order Metadata Box */}
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Khách hàng / Bàn:</span>
                  <span className="font-bold text-gray-900">{selectedOrder.customerName || selectedOrder.table || 'Mang về'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Thời gian hoàn tất:</span>
                  <span className="font-medium text-gray-800 font-mono text-xs">
                    {new Date(selectedOrder.completedAt || selectedOrder.timestamp).toLocaleTimeString('vi-VN')} - {new Date(selectedOrder.completedAt || selectedOrder.timestamp).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Phương thức thanh toán:</span>
                  {selectedOrder.paymentMethod === 'transfer' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 text-xs">
                      <CreditCard size={12} />
                      <span>Chuyển khoản QR</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200/60 text-xs">
                      <Banknote size={12} />
                      <span>Tiền mặt</span>
                    </span>
                  )}
                </div>
                {selectedOrder.note && (
                  <div className="pt-1.5 border-t border-gray-200/60 text-xs">
                    <span className="text-gray-500 block mb-0.5 font-medium">Ghi chú đơn:</span>
                    <p className="text-amber-800 font-medium italic bg-amber-50/60 p-2 rounded-lg border border-amber-200/40">
                      "{selectedOrder.note}"
                    </p>
                  </div>
                )}
              </div>

              {/* Itemized List for Reconciliation */}
              <div>
                <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Chi tiết các món ({selectedOrder.items.reduce((s, i) => s + i.quantity, 0)})</span>
                  <span className="text-gray-400 font-normal lowercase">đối soát pha chế</span>
                </h4>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 space-y-1.5 hover:bg-gray-50/60 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="font-bold text-gray-800 text-sm">
                          <span className="text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded mr-1.5 text-xs">
                            {item.quantity}x
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <div className="font-bold text-gray-900 text-sm shrink-0">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>

                      {/* Item Options Details */}
                      {(item.options?.sweetness || item.options?.milkTemp || item.options?.sweetener || item.options?.itemNote) && (
                        <div className="flex flex-wrap gap-1 pt-0.5 pl-6">
                          {item.options.sweetness && (
                            <span className="text-[11px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                              {item.options.sweetness}
                            </span>
                          )}
                          {item.options.milkTemp && (
                            <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                              {item.options.milkTemp}
                            </span>
                          )}
                          {item.options.sweetener && (
                            <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-100">
                              {item.options.sweetener}
                            </span>
                          )}
                          {item.options.itemNote && (
                            <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-100">
                              Ghi chú: {item.options.itemNote}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Summary Box */}
              <div className="bg-amber-500/10 border border-amber-300/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-amber-900 font-bold uppercase tracking-wider block">Tổng thanh toán</span>
                  <span className="text-[11px] text-amber-700">Đã thu đủ theo hóa đơn</span>
                </div>
                <span className="text-xl font-black text-amber-900">
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCopyOrderInfo(selectedOrder)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-xl font-bold text-xs sm:text-sm min-h-[46px] active:scale-98 transition-all shadow-2xs"
              >
                {copiedInfo ? (
                  <>
                    <Check size={16} className="text-emerald-600" />
                    <span className="text-emerald-700">Đã sao chép phiếu!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="text-gray-500" />
                    <span>Sao chép thông tin đối soát</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs sm:text-sm min-h-[46px] active:scale-98 transition-all shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
