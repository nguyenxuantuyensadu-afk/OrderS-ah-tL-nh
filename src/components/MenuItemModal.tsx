import { useState, FormEvent, useEffect } from 'react';
import { MenuItem } from '../types';
import { X, Trash2, SlidersHorizontal, AlertCircle, Save } from 'lucide-react';
import { formatCurrency } from '../data';

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: MenuItem | null; // If null, create mode; otherwise edit mode
  categories?: string[];
  onSave: (item: MenuItem) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function MenuItemModal({
  isOpen,
  onClose,
  item,
  categories = ['Cà phê', 'Trà', 'Trà sữa', 'Sinh tố', 'Nước ép', 'Đồ ăn nhẹ'],
  onSave,
  onDelete
}: MenuItemModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [hasOptions, setHasOptions] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setName(item.name);
        setCategory(item.category);
        setPriceStr(item.price.toString());
        setHasOptions(item.hasOptions !== false);
      } else {
        setName('');
        setCategory(categories[0] || 'Cà phê');
        setPriceStr('');
        setHasOptions(true);
      }
      setShowConfirmDelete(false);
      setError('');
      setIsSaving(false);
      setIsDeleting(false);
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const parsedPrice = parseInt(priceStr.replace(/\D/g, ''), 10) || 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanCategory = category.trim();

    if (!cleanName) {
      setError('Vui lòng nhập tên món.');
      return;
    }
    if (!cleanCategory) {
      setError('Vui lòng chọn hoặc nhập danh mục món.');
      return;
    }
    if (parsedPrice <= 0) {
      setError('Giá bán phải lớn hơn 0 VNĐ.');
      return;
    }

    setIsSaving(true);
    try {
      const savedItem: MenuItem = {
        id: item ? item.id : ('m_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4)),
        name: cleanName,
        category: cleanCategory,
        price: parsedPrice,
        hasOptions
      };

      await onSave(savedItem);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu món, vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    setIsDeleting(true);
    setError('');
    try {
      await onDelete(item.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể xóa món, vui lòng thử lại.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div 
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900">
              {item ? 'Chỉnh sửa món' : 'Thêm món mới'}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {item ? `Mã món: #${item.id}` : 'Thêm món mới vào thực đơn của quán'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            type="button"
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full active:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Tên món */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Tên món ăn / đồ uống <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
              placeholder="Ví dụ: Cà phê cốt dừa, Trà đào..."
            />
          </div>

          {/* Danh mục */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                Danh mục <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="text"
              required
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none min-h-[44px]"
              placeholder="Nhập hoặc chọn danh mục bên dưới"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {categories.map((c, i) => (
                <option key={i} value={c} />
              ))}
            </datalist>

            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {categories.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                    category === c 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Giá bán */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Giá bán niêm yết (VNĐ) <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={priceStr}
                onChange={e => setPriceStr(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-3.5 pr-14 py-2.5 text-base sm:text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none min-h-[44px]"
                placeholder="25000"
              />
              <span className="absolute right-3.5 text-xs font-bold text-gray-400 select-none">
                VNĐ
              </span>
            </div>
            {parsedPrice > 0 && (
              <p className="text-[11px] text-amber-700 font-bold mt-1">
                Hiển thị: {formatCurrency(parsedPrice)}
              </p>
            )}
          </div>

          {/* Has Options Checkbox */}
          <label className="flex items-start gap-3 p-3 rounded-2xl border border-gray-200 bg-gray-50/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasOptions}
              onChange={e => setHasOptions(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 border-gray-300"
            />
            <div className="text-xs">
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-amber-600" />
                <span>Cho phép chọn Tùy chọn pha chế</span>
              </p>
              <p className="text-gray-500 mt-0.5 leading-relaxed">
                Món sẽ có các tùy chọn: Chất làm ngọt, Sữa nóng/lạnh, Độ ngọt khi thêm vào giỏ. Bỏ tích nếu là món đóng lon hoặc đồ ăn sẵn.
              </p>
            </div>
          </label>

          {/* Danger Zone: Delete Confirmation when Editing */}
          {item && onDelete && (
            <div className="pt-2 border-t border-gray-100">
              {!showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors active:scale-98"
                >
                  <Trash2 size={15} />
                  <span>Xóa món này khỏi thực đơn</span>
                </button>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2 animate-in fade-in">
                  <p className="text-xs font-bold text-red-800">
                    Xác nhận xóa món "{item.name}"?
                  </p>
                  <p className="text-[11px] text-red-600">
                    Món này sẽ bị gỡ vĩnh viễn khỏi danh sách thực đơn trên toàn hệ thống.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      disabled={isDeleting}
                      className="flex-1 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50"
                    >
                      Giữ lại
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                    >
                      {isDeleting ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        <>
                          <Trash2 size={13} />
                          <span>Đồng ý xóa</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 text-xs sm:text-sm min-h-[46px] active:scale-98 transition-all"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl font-bold shadow-md shadow-amber-200 text-xs sm:text-sm min-h-[46px] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save size={16} />
                  <span>{item ? 'Lưu thay đổi' : 'Thêm vào thực đơn'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
