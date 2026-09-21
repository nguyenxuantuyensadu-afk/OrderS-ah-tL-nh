import { useState } from 'react';
import { Order, PaymentSettings } from '../types';
import { formatCurrency, defaultPaymentSettings } from '../data';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  Receipt, 
  DollarSign, 
  QrCode, 
  X, 
  AlertCircle, 
  Sparkles,
  ShoppingBag,
  User,
  Copy,
  Check
} from 'lucide-react';

interface ServingTabProps {
  orders: Order[];
  onCompletePayment: (orderId: string, paymentMethod: 'cash' | 'transfer') => Promise<void>;
  paymentSettings?: PaymentSettings;
}

export default function ServingTab({ orders, onCompletePayment, paymentSettings = defaultPaymentSettings }: ServingTabProps) {
  const [filter, setFilter] = useState<'all' | 'ready' | 'cooking'>('all');
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [amountGiven, setAmountGiven] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);

  // Active orders are those in kitchen or ready to be served / waiting for payment
  const activeOrders = orders.filter(o => o.status === 'in_kitchen' || o.status === 'ready');
  const readyCount = activeOrders.filter(o => o.status === 'ready').length;
  const cookingCount = activeOrders.filter(o => o.status === 'in_kitchen').length;

  const displayedOrders = activeOrders.filter(o => {
    if (filter === 'ready') return o.status === 'ready';
    if (filter === 'cooking') return o.status === 'in_kitchen';
    return true;
  }).sort((a, b) => {
    // Show 'ready' orders on top so staff can serve and collect payment promptly
    if (a.status === 'ready' && b.status !== 'ready') return -1;
    if (b.status === 'ready' && a.status !== 'ready') return 1;
    return b.timestamp - a.timestamp;
  });

  const handleOpenPayment = (order: Order) => {
    setPayingOrder(order);
    setPaymentMethod('cash');
    setAmountGiven(order.total.toString());
  };

  const handleConfirmPayment = async () => {
    if (!payingOrder) return;
    setIsSubmitting(true);
    try {
      await onCompletePayment(payingOrder.id, paymentMethod);
      setPayingOrder(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cashGivenNumber = parseInt(amountGiven.replace(/\D/g, '')) || 0;
  const changeDue = payingOrder ? Math.max(0, cashGivenNumber - payingOrder.total) : 0;

  return (
    <div className="p-3 sm:p-5 lg:p-6 bg-gray-50/60 h-full overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Giao món & Tính tiền</h2>
            <p className="text-xs sm:text-sm text-gray-500">Gọi tên khách khi bếp ra món và tiến hành thanh toán</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white p-1 rounded-2xl border border-gray-200 shadow-xs self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Tất cả ({activeOrders.length})
          </button>

          <button
            onClick={() => setFilter('ready')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'ready'
                ? 'bg-green-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bell size={14} className={readyCount > 0 ? 'animate-bounce' : ''} />
            <span>Bếp đã làm xong</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${filter === 'ready' ? 'bg-green-700 text-white' : 'bg-green-100 text-green-700'}`}>
              {readyCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('cooking')}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              filter === 'cooking'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>Đang làm</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[11px] ${filter === 'cooking' ? 'bg-orange-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
              {cookingCount}
            </span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white rounded-3xl border border-gray-200 shadow-sm my-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
            {filter === 'ready' ? 'Chưa có đơn nào bếp vừa làm xong' : 'Hiện tại không có đơn mang về nào đang chờ'}
          </h3>
          <p className="text-gray-500 max-w-sm text-xs sm:text-sm">
            {filter === 'ready' 
              ? 'Khi bếp làm xong và bấm "Ra món", đơn hàng sẽ sáng lên tại đây để nhân viên gọi tên khách giao đồ và tính tiền.'
              : 'Tất cả các đơn mang về đã được giao và thanh toán hoàn tất.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-5 items-start">
          {displayedOrders.map(order => {
            const isReady = order.status === 'ready';
            const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const displayName = order.customerName || order.table || 'Khách mang về';

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl sm:rounded-3xl border-2 transition-all shadow-xs overflow-hidden flex flex-col ${
                  isReady ? 'border-green-500 ring-2 ring-green-100' : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className={`p-3 sm:p-4 border-b flex items-center justify-between ${
                  isReady ? 'bg-green-50/70 border-green-200' : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono font-bold bg-gray-800 text-white px-2 py-0.5 rounded-lg shrink-0">
                      #{order.id.slice(-4).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <User size={15} className="text-gray-500 shrink-0" />
                      <h3 className="text-base sm:text-lg font-black text-gray-800 truncate">{displayName}</h3>
                    </div>
                  </div>

                  {isReady ? (
                    <span className="inline-flex items-center gap-1 bg-green-500 text-white px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold animate-pulse shadow-xs shrink-0 ml-2">
                      <Bell size={12} />
                      <span>ĐÃ RA MÓN</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ml-2">
                      <Clock size={12} />
                      <span>Đang làm</span>
                    </span>
                  )}
                </div>

                {/* Note */}
                {order.note && (
                  <div className="px-3 sm:px-4 py-2 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs font-medium flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0 text-amber-600" />
                    <span className="line-clamp-2">Ghi chú: <strong>{order.note}</strong></span>
                  </div>
                )}

                {/* Body Items */}
                <div className="p-3 sm:p-4 space-y-2 flex-1">
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {order.items.map((item, idx) => {
                      const hasOptions = item.options && (item.options.size || item.options.sweetener || item.options.milkTemp || item.options.sweetness || item.options.itemNote || item.itemNote);
                      const noteText = item.options?.itemNote || item.itemNote;

                      return (
                        <div key={item.cartItemId || idx} className="py-1.5 border-b border-gray-100 last:border-none">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                              <span className="font-black text-amber-600 w-5 shrink-0">{item.quantity}x</span>
                              <span className="font-bold text-gray-800 truncate">{item.name}</span>
                              {item.options?.size && (
                                <span className={`px-1.5 py-0.2 rounded font-black text-[10px] uppercase shrink-0 ${
                                  item.options.size === 'L' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  Size {item.options.size}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-600 text-xs font-semibold shrink-0 ml-2">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>

                          {/* Options pills */}
                          {hasOptions && (
                            <div className="flex flex-wrap gap-1 mt-1 pl-6 text-[10px]">
                              {item.options?.size && (
                                <span className={`px-1.5 py-0.5 rounded font-bold ${
                                  item.options.size === 'L' ? 'bg-purple-50 text-purple-800' : 'bg-amber-50 text-amber-800'
                                }`}>
                                  Size {item.options.size}
                                </span>
                              )}
                              {item.options?.milkTemp && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                                  {item.options.milkTemp}
                                </span>
                              )}
                              {item.options?.sweetener && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold">
                                  {item.options.sweetener}
                                </span>
                              )}
                              {item.options?.sweetness && (
                                <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-semibold">
                                  {item.options.sweetness}
                                </span>
                              )}
                              {noteText && (
                                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 font-semibold">
                                  {noteText}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-500 font-medium">Tổng ({totalItemsCount} món):</span>
                    <span className="text-lg sm:text-xl font-black text-amber-600">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2.5">
                  <span className="text-[11px] text-gray-400">
                    {new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <button
                    onClick={() => handleOpenPayment(order)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 touch-manipulation ${
                      isReady 
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' 
                        : 'bg-gray-800 hover:bg-gray-900 text-white shadow-gray-200'
                    }`}
                  >
                    <Receipt size={16} />
                    <span>Tính tiền ({formatCurrency(order.total)})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment & Receipt Modal - Fullscreen on mobile, centered modal on desktop */}
      {payingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in fade-in slide-in-from-bottom-8 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-amber-500 text-white shrink-0">
              <div className="flex items-center gap-2">
                <Receipt size={20} />
                <h3 className="text-base sm:text-xl font-black truncate">
                  Tính tiền - {payingOrder.customerName || payingOrder.table || 'Khách mang về'}
                </h3>
              </div>
              <button
                onClick={() => setPayingOrder(null)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              {/* Order summary table */}
              <div className="bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 space-y-2">
                <div className="flex justify-between text-[11px] text-gray-500 font-bold border-b pb-1.5">
                  <span>MÓN</span>
                  <span>SL</span>
                  <span>THÀNH TIỀN</span>
                </div>
                {payingOrder.items.map((item, i) => {
                  const hasOptions = item.options && (item.options.size || item.options.sweetener || item.options.milkTemp || item.options.sweetness || item.options.itemNote || item.itemNote);
                  const noteText = item.options?.itemNote || item.itemNote;

                  return (
                    <div key={i} className="py-1.5 border-b border-gray-100 last:border-none">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <div className="flex-1 truncate pr-2 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-800">{item.name}</span>
                          {item.options?.size && (
                            <span className={`px-1.5 py-0.2 rounded font-black text-[10px] uppercase shrink-0 ${
                              item.options.size === 'L' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              Size {item.options.size}
                            </span>
                          )}
                        </div>
                        <span className="w-8 text-center text-gray-600">{item.quantity}</span>
                        <span className="font-bold text-gray-700">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                      {hasOptions && (
                        <div className="flex flex-wrap gap-1 text-[10px] text-gray-500 mt-0.5">
                          {item.options?.size && (
                            <span className="font-bold text-purple-700">• Size {item.options.size}</span>
                          )}
                          {item.options?.milkTemp && <span>• {item.options.milkTemp}</span>}
                          {item.options?.sweetener && <span>• {item.options.sweetener}</span>}
                          {item.options?.sweetness && <span>• {item.options.sweetness}</span>}
                          {noteText && <span className="text-amber-700">• {noteText}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 flex justify-between items-center text-base sm:text-lg font-black text-gray-900 border-t border-gray-200">
                  <span>Cần thanh toán:</span>
                  <span className="text-xl sm:text-2xl text-amber-600">{formatCurrency(payingOrder.total)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Phương thức thanh toán
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all ${
                      paymentMethod === 'cash'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <DollarSign size={18} />
                    <span>Tiền mặt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all ${
                      paymentMethod === 'transfer'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <QrCode size={18} />
                    <span>Chuyển khoản QR</span>
                  </button>
                </div>
              </div>

              {/* Cash payment details */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2.5 bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      Khách đưa (VNĐ):
                    </label>
                    <input
                      type="number"
                      value={amountGiven}
                      onChange={e => setAmountGiven(e.target.value)}
                      className="w-full text-lg sm:text-xl font-bold p-2.5 sm:p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      placeholder="Nhập số tiền khách đưa"
                    />
                  </div>

                  {/* Quick cash suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[payingOrder.total, 50000, 100000, 200000, 500000].map(val => {
                      if (val < payingOrder.total && val !== payingOrder.total) return null;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmountGiven(val.toString())}
                          className="text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-amber-400 text-gray-700 transition-colors"
                        >
                          {formatCurrency(val)}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="text-xs sm:text-sm font-bold text-gray-600">Tiền thừa trả khách:</span>
                    <span className={`text-lg sm:text-xl font-black ${changeDue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(changeDue)}
                    </span>
                  </div>
                </div>
              )}

              {/* QR payment details */}
              {paymentMethod === 'transfer' && (() => {
                const isCustomImage = paymentSettings?.qrType === 'custom_image' && Boolean(paymentSettings?.qrImageUrl);
                const bankId = paymentSettings?.bankId || 'MB';
                const accountNo = paymentSettings?.accountNo || '0988888888';
                const accountName = paymentSettings?.accountName || 'QUAN POS MINI';
                const memo = `${paymentSettings?.notePrefix || 'DH'} ${payingOrder.orderNumber || payingOrder.id.slice(-4)}`;
                const vietQrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${payingOrder.total}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;
                const qrSrc = isCustomImage ? paymentSettings?.qrImageUrl : vietQrUrl;

                return (
                  <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
                    <div className="relative mx-auto bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200 shadow-sm max-w-[240px]">
                      {qrSrc ? (
                        <img 
                          src={qrSrc} 
                          alt="Mã QR thanh toán" 
                          className="w-full h-auto object-contain rounded-xl max-h-[200px] mx-auto"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300">
                          <QrCode size={80} className="text-gray-800" />
                          <span className="text-[9px] font-bold text-gray-500 mt-1">VIETQR NGAN HANG</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-600 space-y-1 bg-white p-2.5 rounded-xl border border-gray-100 text-left">
                      <div className="flex justify-between items-center text-gray-800 font-bold">
                        <span>Số tiền:</span>
                        <span className="text-base text-amber-600 font-black">{formatCurrency(payingOrder.total)}</span>
                      </div>
                      
                      {!isCustomImage && (
                        <>
                          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-100">
                            <span className="text-gray-500">Ngân hàng:</span>
                            <span className="font-bold text-gray-800">{paymentSettings?.bankName || bankId}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-gray-500">Số tài khoản:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-800">{accountNo}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(accountNo);
                                  setCopiedAcc(true);
                                  setTimeout(() => setCopiedAcc(false), 2000);
                                }}
                                className="p-0.5 text-gray-400 hover:text-amber-600"
                                title="Sao chép số tài khoản"
                              >
                                {copiedAcc ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-gray-500">Chủ tài khoản:</span>
                            <span className="font-bold uppercase text-gray-800">{accountName}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-gray-500">Nội dung CK:</span>
                            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">{memo}</span>
                          </div>
                        </>
                      )}

                      {isCustomImage && (
                        <p className="text-center text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                          Khách quét mã QR trên ứng dụng ngân hàng hoặc ví điện tử
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-5 border-t border-gray-100 bg-gray-50 flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setPayingOrder(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-base shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Xác nhận đã tính tiền</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
