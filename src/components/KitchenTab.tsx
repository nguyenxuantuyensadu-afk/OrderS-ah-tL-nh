import { useState, useEffect } from 'react';
import { Order } from '../types';
import { ChefHat, Clock, CheckCircle2, AlertCircle, Sparkles, User, Snowflake, Flame } from 'lucide-react';

interface KitchenTabProps {
  orders: Order[];
  onMarkReady: (orderId: string) => Promise<void>;
}

export default function KitchenTab({ orders, onMarkReady }: KitchenTabProps) {
  const [filter, setFilter] = useState<'cooking' | 'ready' | 'all'>('cooking');
  const [now, setNow] = useState(Date.now());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Update elapsed time every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const kitchenOrders = orders.filter(o => o.status === 'in_kitchen');
  const readyOrders = orders.filter(o => o.status === 'ready');

  const displayedOrders = orders.filter(o => {
    if (filter === 'cooking') return o.status === 'in_kitchen';
    if (filter === 'ready') return o.status === 'ready';
    return o.status === 'in_kitchen' || o.status === 'ready';
  }).sort((a, b) => {
    // Show oldest kitchen orders first (FIFO)
    if (a.status === 'in_kitchen' && b.status === 'in_kitchen') {
      return a.timestamp - b.timestamp;
    }
    return b.timestamp - a.timestamp;
  });

  const getElapsedTimeText = (timestamp: number) => {
    const diffSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 1) return 'Vừa gửi';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m trước`;
  };

  const getUrgencyClass = (timestamp: number) => {
    const minutes = Math.floor((now - timestamp) / 60000);
    if (minutes >= 15) return 'border-red-500 bg-red-50/20';
    if (minutes >= 8) return 'border-amber-400 bg-amber-50/10';
    return 'border-gray-200 bg-white';
  };

  const handleRaMon = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      await onMarkReady(orderId);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 bg-gray-50/60 h-full overflow-y-auto flex flex-col">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
            <ChefHat size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Màn hình Bếp / Pha chế</h2>
            <p className="text-xs sm:text-sm text-gray-500">Tiếp nhận phiếu order và thông báo ra món</p>
          </div>
        </div>

        {/* Filter Pills & Summary Count - Responsive wrap/scroll */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-xs self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter('cooking')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'cooking'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Chờ làm</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${filter === 'cooking' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
              {kitchenOrders.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('ready')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'ready'
                ? 'bg-green-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Đã làm xong</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${filter === 'ready' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'}`}>
              {readyOrders.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-gray-800 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả ({kitchenOrders.length + readyOrders.length})
          </button>
        </div>
      </div>

      {/* Orders Grid - 1 col on mobile, 2 cols on tablet, 3-4 on desktop */}
      {displayedOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white rounded-3xl border border-gray-200 shadow-sm my-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
            {filter === 'cooking' ? 'Không có món nào chờ làm' : 'Chưa có phiếu order nào'}
          </h3>
          <p className="text-gray-500 max-w-sm text-xs sm:text-sm">
            {filter === 'cooking'
              ? 'Khi nhân viên nhập tên khách và gửi order, phiếu sẽ xuất hiện tại đây theo thời gian thực.'
              : 'Tất cả các món đã được bếp chế biến xong và sẵn sàng giao cho khách.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-5 items-start">
          {displayedOrders.map((order) => {
            const isCooking = order.status === 'in_kitchen';
            const elapsedText = getElapsedTimeText(order.timestamp);
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const displayName = order.customerName || order.table || 'Khách mang về';

            return (
              <div
                key={order.id}
                className={`rounded-2xl sm:rounded-3xl border-2 shadow-xs transition-all overflow-hidden flex flex-col ${
                  isCooking ? getUrgencyClass(order.timestamp) : 'border-green-200 bg-white'
                }`}
              >
                {/* Header Card */}
                <div className={`p-3 sm:p-4 border-b flex items-center justify-between ${
                  isCooking ? 'bg-orange-50/60 border-orange-100' : 'bg-green-50 border-green-100'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-gray-900 text-white font-mono shrink-0">
                      #{order.id.slice(-4).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User size={15} className="text-gray-500 shrink-0" />
                      <h4 className="text-base sm:text-lg font-black text-gray-800 truncate">
                        {displayName}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-600 shrink-0 ml-2">
                    <Clock size={13} className={isCooking ? 'text-orange-600' : 'text-green-600'} />
                    <span>{elapsedText}</span>
                  </div>
                </div>

                {/* Note banner if present */}
                {order.note && (
                  <div className="px-3 sm:px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-2 text-amber-800 text-xs font-medium">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                    <span className="line-clamp-2">Ghi chú: <strong className="font-bold">{order.note}</strong></span>
                  </div>
                )}

                {/* Items List */}
                <div className="p-3 sm:p-4 flex-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 pb-1 border-b border-gray-100 uppercase tracking-wider">
                    <span>Món cần làm</span>
                    <span>Số lượng ({totalItemsCount})</span>
                  </div>

                  {order.items.map((item, i) => {
                    const hasOptions = item.options && (item.options.sweetener || item.options.milkTemp || item.options.sweetness || item.options.itemNote || item.itemNote);
                    const noteText = item.options?.itemNote || item.itemNote;

                    return (
                      <div
                        key={item.cartItemId || item.id || i}
                        className="py-2 px-2.5 rounded-xl bg-gray-50/90 border border-gray-200/70 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0 shadow-2xs">
                              {item.quantity}
                            </span>
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 text-xs sm:text-sm truncate">{item.name}</p>
                              <span className="text-[10px] text-gray-400 font-medium">{item.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Pha chế options for Kitchen */}
                        {hasOptions && (
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-gray-200/60 text-[11px]">
                            {item.options?.milkTemp && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold text-xs bg-blue-100 text-blue-800">
                                {item.options.milkTemp.includes('Lạnh') ? <Snowflake size={12} /> : <Flame size={12} />}
                                <span>{item.options.milkTemp}</span>
                              </span>
                            )}

                            {item.options?.sweetener && (
                              <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-amber-100 text-amber-900">
                                {item.options.sweetener}
                              </span>
                            )}

                            {item.options?.sweetness && (
                              <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-green-100 text-green-800">
                                {item.options.sweetness}
                              </span>
                            )}

                            {noteText && (
                              <div className="w-full text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                                Lưu ý: {noteText}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action */}
                <div className="p-3 sm:p-4 border-t border-gray-100 bg-white flex items-center justify-between gap-2.5">
                  <div className="text-[11px] text-gray-400">
                    {new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {isCooking ? (
                    <button
                      onClick={() => handleRaMon(order.id)}
                      disabled={loadingId === order.id}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2.5 rounded-xl shadow-md shadow-orange-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 touch-manipulation"
                    >
                      {loadingId === order.id ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Ra món ngay</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <CheckCircle2 size={14} />
                      <span>Đã ra món</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
