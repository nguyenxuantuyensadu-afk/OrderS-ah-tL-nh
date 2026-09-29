import { useState, useEffect } from 'react';
import { Order, CartItem } from '../types';
import { formatCurrency } from '../data';
import { 
  AlertTriangle, 
  X, 
  Minus, 
  Plus, 
  Check, 
  Ban,
  ShoppingBag,
  Info
} from 'lucide-react';

interface CancelModalProps {
  isOpen: boolean;
  order: Order | null;
  targetItem: CartItem | null;
  onClose: () => void;
  onConfirmCancelItem: (orderId: string, item: CartItem, cancelQty: number, reason: string) => Promise<void>;
  onConfirmCancelOrder: (orderId: string, reason: string) => Promise<void>;
}

const PRESET_REASONS_ITEM = [
  'Khách đổi ý / Đổi món khác',
  'Hết nguyên liệu pha chế',
  'Khách đợi lâu, huỷ món',
  'Nhân viên bấm nhầm món'
];

const PRESET_REASONS_ORDER = [
  'Khách đổi ý không lấy đơn',
  'Hết nguyên liệu / Quán không làm được',
  'Khách đợi lâu nên bỏ về',
  'Tạo nhầm đơn hàng'
];

export default function CancelModal({
  isOpen,
  order,
  targetItem,
  onClose,
  onConfirmCancelItem,
  onConfirmCancelOrder
}: CancelModalProps) {
  const [cancelQty, setCancelQty] = useState<number>(1);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCancelQty(targetItem ? targetItem.quantity : 1);
      setSelectedReason(targetItem ? PRESET_REASONS_ITEM[0] : PRESET_REASONS_ORDER[0]);
      setCustomReason('');
      setIsSubmitting(false);
    }
  }, [isOpen, targetItem, order]);

  if (!isOpen || !order) return null;

  const isCancellingItem = targetItem !== null;
  const reasonsList = isCancellingItem ? PRESET_REASONS_ITEM : PRESET_REASONS_ORDER;
  const finalReason = customReason.trim() || selectedReason;

  // Calculate unit price for the target item (including size L if applicable)
  const itemUnitPrice = targetItem 
    ? ((targetItem.options?.size === 'L' && targetItem.priceL) ? targetItem.priceL : targetItem.price)
    : 0;
  const itemDeductionTotal = itemUnitPrice * cancelQty;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (isCancellingItem && targetItem) {
        await onConfirmCancelItem(order.id, targetItem, cancelQty, finalReason);
      } else {
        await onConfirmCancelOrder(order.id, finalReason);
      }
      onClose();
    } catch (err) {
      console.error("Error cancelling:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-red-50/80 border-b border-red-100 p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-200 shrink-0">
              <Ban size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                {isCancellingItem ? 'Huỷ món trong bếp' : 'Huỷ toàn bộ đơn hàng'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Đơn #{order.id.slice(-4).toUpperCase()} • {order.customerName || order.table || 'Khách mang về'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-all"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Target Item Details Card */}
          {isCancellingItem && targetItem && (
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-gray-900 text-sm sm:text-base">{targetItem.name}</h4>
                    {targetItem.options?.size && (
                      <span className={`px-2 py-0.5 rounded-md font-black text-xs uppercase ${
                        targetItem.options.size === 'L' ? 'bg-purple-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        Size {targetItem.options.size}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{targetItem.category} • Đang có trong đơn: {targetItem.quantity} ly</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-black text-gray-900 text-sm">{formatCurrency(itemUnitPrice)}/ly</span>
                </div>
              </div>

              {/* Quantity selector if targetItem has more than 1 */}
              {targetItem.quantity > 1 && (
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Số lượng huỷ:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCancelQty(prev => Math.max(1, prev - 1))}
                      disabled={cancelQty <= 1}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 active:scale-95 disabled:opacity-40"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-black text-base text-red-600">{cancelQty}</span>
                    <button
                      type="button"
                      onClick={() => setCancelQty(prev => Math.min(targetItem.quantity, prev + 1))}
                      disabled={cancelQty >= targetItem.quantity}
                      className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-700 hover:bg-gray-100 active:scale-95 disabled:opacity-40"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cancellation Summary Banner */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/70 flex items-start gap-2.5 text-amber-900 text-xs">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              {isCancellingItem ? (
                <>
                  <p className="font-bold">
                    Giảm trừ tiền hoá đơn: -{formatCurrency(itemDeductionTotal)}
                  </p>
                  <p className="text-amber-700">
                    Món sẽ bị gỡ bỏ khỏi danh sách bếp cần làm. Nếu đơn không còn món nào khác, toàn bộ phiếu order sẽ tự động chuyển sang trạng thái huỷ.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold">
                    Toàn bộ đơn hàng ({order.items.length} món) trị giá {formatCurrency(order.total)} sẽ bị huỷ.
                  </p>
                  <p className="text-amber-700">
                    Phiếu order sẽ rời khỏi màn hình bếp và màn hình thu ngân ngay lập tức.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Lý do huỷ món:
            </label>
            <div className="space-y-1.5">
              {reasonsList.map((reason) => {
                const isSelected = selectedReason === reason && !customReason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setSelectedReason(reason);
                      setCustomReason('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && <Check size={14} className="text-red-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Reason Input */}
            <div className="pt-1">
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Hoặc nhập lý do khác (không bắt buộc)..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden transition-all bg-gray-50/50"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold text-gray-600 hover:bg-white active:scale-95 transition-all"
          >
            Quay lại
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Ban size={15} />
                <span>{isCancellingItem ? `Xác nhận huỷ ${cancelQty} món` : 'Xác nhận huỷ đơn'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
