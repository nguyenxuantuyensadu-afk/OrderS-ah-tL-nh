import { useState, MouseEvent } from 'react';
import { MenuItem, CartItem, ItemOptions, PreparationOptionsSettings, itemSupportsSizes } from '../types';
import { formatCurrency, defaultPreparationOptions } from '../data';
import ItemCustomizeModal from './ItemCustomizeModal';
import MenuItemModal from './MenuItemModal';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Edit2,
  ShoppingCart, 
  Send, 
  CheckCircle2, 
  Search, 
  Coffee, 
  User, 
  ChevronUp, 
  X,
  SlidersHorizontal,
  Flame,
  Snowflake
} from 'lucide-react';

interface OrderTabProps {
  menu: MenuItem[];
  onSendToKitchen: (cart: CartItem[], total: number, customerName: string, note: string) => Promise<void>;
  optionsSettings?: PreparationOptionsSettings;
  userRole?: 'admin' | 'staff';
  onSaveMenuItem?: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem?: (id: string) => Promise<void>;
}

const QUICK_NAMES = ['Khách mang về', 'Khách quen', 'Anh Nam', 'Chị Lan', 'Anh Tuấn', 'Chị Mai'];

export default function OrderTab({ 
  menu, 
  onSendToKitchen, 
  optionsSettings = defaultPreparationOptions,
  userRole,
  onSaveMenuItem,
  onDeleteMenuItem
}: OrderTabProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  // Mobile cart sheet toggle state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Admin Item Edit / Delete Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [itemToast, setItemToast] = useState<string | null>(null);

  const categories = ['all', ...Array.from(new Set(menu.map(item => item.category)))];

  const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Helper: Open customization modal for a menu item
  const handleOpenCustomize = (item: MenuItem, existingCartItem?: CartItem) => {
    setCustomizingItem(item);
    setEditingCartItem(existingCartItem || null);
    setIsModalOpen(true);
  };

  // Helper to compare options
  const areOptionsEqual = (opt1?: ItemOptions, opt2?: ItemOptions) => {
    return (
      (opt1?.size || '') === (opt2?.size || '') &&
      (opt1?.sweetener || '') === (opt2?.sweetener || '') &&
      (opt1?.milkTemp || '') === (opt2?.milkTemp || '') &&
      (opt1?.sweetness || '') === (opt2?.sweetness || '') &&
      (opt1?.itemNote || '') === (opt2?.itemNote || '')
    );
  };

  // Confirm custom choices from modal
  const handleConfirmCustomize = (item: MenuItem, options: ItemOptions, quantity: number) => {
    const hasSizes = itemSupportsSizes(item);
    const sizePrice = (hasSizes && options.size === 'L') ? (item.priceL || item.price + 5000) : item.price;
    const finalItem: MenuItem = {
      ...item,
      price: sizePrice,
    };

    setCart(prev => {
      if (editingCartItem) {
        // Editing existing cart item
        return prev.map(ci => {
          if (ci.cartItemId === editingCartItem.cartItemId) {
            const updated: CartItem = {
              ...ci,
              price: sizePrice,
              options,
              quantity,
            };
            if (options.itemNote) {
              updated.itemNote = options.itemNote;
            } else {
              delete updated.itemNote;
            }
            return updated;
          }
          return ci;
        });
      }

      // Check if identical item with identical options already exists
      const existingIndex = prev.findIndex(ci => ci.id === item.id && areOptionsEqual(ci.options, options));
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          price: sizePrice,
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      // Add new cart item with unique cartItemId
      const newCartItem: CartItem = {
        ...finalItem,
        cartItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        quantity,
        options,
      };
      if (options.itemNote) {
        newCartItem.itemNote = options.itemNote;
      }
      return [...prev, newCartItem];
    });

    setEditingCartItem(null);
  };

  // Admin Menu Item Handlers
  const handleAdminSaveMenuItem = async (itemData: MenuItem) => {
    if (!onSaveMenuItem) return;
    await onSaveMenuItem(itemData);
    setItemToast(editingMenuItem ? `Đã cập nhật món "${itemData.name}" thành công!` : `Đã thêm món "${itemData.name}" vào thực đơn!`);
    setTimeout(() => setItemToast(null), 3500);
  };

  const handleAdminDeleteMenuItem = async (id: string) => {
    if (!onDeleteMenuItem) return;
    const found = menu.find(m => m.id === id);
    await onDeleteMenuItem(id);
    setItemToast(`Đã xóa món "${found?.name || id}" khỏi thực đơn!`);
    setTimeout(() => setItemToast(null), 3500);
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete || !onDeleteMenuItem) return;
    setIsDeletingItem(true);
    try {
      await handleAdminDeleteMenuItem(itemToDelete.id);
      setItemToDelete(null);
    } catch (err: any) {
      alert('Lỗi khi xóa món: ' + (err?.message || 'Thử lại sau'));
    } finally {
      setIsDeletingItem(false);
    }
  };

  // Quick direct add (uses standard defaults)
  const quickAddToCart = (item: MenuItem, e?: MouseEvent) => {
    if (e) e.stopPropagation();

    // Default options
    const isCoffee = item.category.toLowerCase().includes('cà phê') || item.name.toLowerCase().includes('cà phê');
    const defaultSweetener = (isCoffee && item.name.toLowerCase().includes('sữa')) ? 'Sữa đặc' : 'Đường cát';
    const hasSizes = itemSupportsSizes(item);

    const defaultOptions: ItemOptions = {
      size: hasSizes ? 'M' : undefined,
      sweetener: defaultSweetener,
      milkTemp: 'Đá (Lạnh)',
      sweetness: '100% ngọt',
    };

    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && areOptionsEqual(i.options, defaultOptions));
      if (existing) {
        return prev.map(i => i.cartItemId === existing.cartItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [
        ...prev,
        {
          ...item,
          cartItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          quantity: 1,
          options: defaultOptions,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      const idMatches = item.cartItemId === cartItemId || item.id === cartItemId;
      if (idMatches) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalCustomerName = customerName.trim() || 'Khách mang về';

  const handleSendOrder = async () => {
    if (cart.length === 0) return;
    setIsSending(true);
    try {
      await onSendToKitchen(cart, total, finalCustomerName, note);
      const name = finalCustomerName;
      setCart([]);
      setCustomerName('');
      setNote('');
      setIsMobileCartOpen(false);
      setSuccessToast(`Đã gửi order cho "${name}" vào bếp thành công!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const filteredMenu = menu.filter(item => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col lg:flex-row h-full relative overflow-hidden">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-700 max-w-[90vw] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <span className="font-bold text-xs sm:text-sm line-clamp-1">{successToast}</span>
        </div>
      )}

      {/* Item Customization Modal */}
      <ItemCustomizeModal
        item={customizingItem}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCustomizingItem(null);
          setEditingCartItem(null);
        }}
        onConfirm={handleConfirmCustomize}
        initialOptions={editingCartItem?.options}
        initialQuantity={editingCartItem?.quantity || 1}
        optionsSettings={optionsSettings}
      />

      {/* Menu Area */}
      <div className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto bg-gray-50/50 flex flex-col pb-24 lg:pb-6">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 uppercase tracking-wide">
                Takeaway / Mang về
              </span>
              <span className="text-[11px] font-semibold text-gray-500 hidden sm:inline">
                • Bấm vào món để tùy chọn Sữa, Độ ngọt, Chất làm ngọt
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight mt-1">Gọi món Takeaway</h2>
            <p className="text-xs sm:text-sm text-gray-500">Chạm vào thẻ món hoặc bấm dấu (+) để mở nhanh tùy chọn pha chế</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm món nhanh..."
                className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none shadow-xs min-h-[42px]"
              />
            </div>
            {userRole === 'admin' && onSaveMenuItem && (
              <button
                type="button"
                onClick={() => {
                  setEditingMenuItem(null);
                  setIsMenuModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold px-3.5 py-2 sm:py-2.5 rounded-xl shadow-xs transition-all shrink-0 min-h-[42px]"
                title="Thêm món mới vào thực đơn"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Thêm món</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Toast for Admin */}
        {itemToast && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2 text-xs font-bold shadow-xs animate-in fade-in">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <span>{itemToast}</span>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2.5 mb-3 scrollbar-none -mx-1 px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all touch-manipulation ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat === 'all' ? 'Tất cả món' : cat}
            </button>
          ))}
        </div>

        {/* Menu Grid - Highly responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 flex-1">
          {filteredMenu.map(item => {
            const countInCart = cart
              .filter(i => i.id === item.id)
              .reduce((sum, i) => sum + i.quantity, 0);

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  if (item.hasOptions === false) {
                    quickAddToCart(item, e);
                  } else {
                    handleOpenCustomize(item);
                  }
                }}
                className={`bg-white p-3 sm:p-4 rounded-2xl shadow-xs border transition-all text-left flex flex-col justify-between active:scale-[0.98] cursor-pointer group relative hover:border-amber-400 hover:shadow-md ${
                  countInCart > 0 ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200/80'
                }`}
              >
                {countInCart > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10">
                    {countInCart}
                  </span>
                )}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[10px] sm:text-[11px] rounded-md">
                        {item.category}
                      </span>
                      {itemSupportsSizes(item) && (
                        <span className="inline-block px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 font-black text-[10px] rounded-md">
                          Size M, L
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {item.hasOptions !== false ? (
                        <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                          <SlidersHorizontal size={11} />
                          <span className="hidden sm:inline">Tùy chọn</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">
                          Món sẵn
                        </span>
                      )}

                      {/* Admin Quick Edit / Delete */}
                      {userRole === 'admin' && (
                        <div className="flex items-center gap-0.5 ml-1 pl-1 border-l border-gray-200" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingMenuItem(item);
                              setIsMenuModalOpen(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all active:scale-90"
                            title="Sửa món"
                            aria-label="Sửa món"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all active:scale-90"
                            title="Xóa món"
                            aria-label="Xóa món"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-800 line-clamp-2 text-xs sm:text-sm group-hover:text-amber-600 transition-colors">
                    {item.name}
                  </h3>
                </div>

                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="font-extrabold text-gray-900 text-xs sm:text-sm">{formatCurrency(item.price)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.hasOptions === false) {
                        quickAddToCart(item, e);
                      } else {
                        handleOpenCustomize(item);
                      }
                    }}
                    title={item.hasOptions === false ? 'Thêm nhanh vào giỏ' : 'Bấm để chọn tùy chọn pha chế & thêm món'}
                    className={`h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl font-black text-xs flex items-center gap-1 transition-all shadow-xs ${
                      item.hasOptions === false
                        ? 'bg-gray-800 hover:bg-gray-900 text-white'
                        : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                    }`}
                  >
                    <Plus size={15} className="stroke-[3]" />
                    <span className="text-[11px] font-bold">
                      {item.hasOptions === false ? 'Thêm' : 'Tùy chọn'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile Screen (< lg) */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-2.5 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-xl">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="flex-1 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-left active:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <ShoppingCart size={20} className="text-amber-600" />
                {totalQuantity > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {totalQuantity}
                  </span>
                )}
              </div>
              <div className="leading-tight">
                <p className="text-[11px] text-gray-500 font-medium">
                  {customerName.trim() ? `Khách: ${customerName}` : 'Khách mang về'}
                </p>
                <p className="text-sm font-black text-amber-700">{formatCurrency(total)}</p>
              </div>
            </div>
            <div className="flex items-center text-xs font-bold text-amber-700">
              <span>Xem giỏ</span>
              <ChevronUp size={16} />
            </div>
          </button>

          <button
            onClick={handleSendOrder}
            disabled={cart.length === 0 || isSending}
            className="bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            {isSending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Send size={16} />
                <span>Gửi bếp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cart Container: Responsive Sidebar on Desktop (lg:), Slide-up Drawer on Mobile */}
      <div 
        className={`fixed lg:static inset-x-0 bottom-0 z-40 lg:z-10 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col w-full lg:w-[410px] xl:w-[450px] shadow-2xl lg:shadow-none transition-transform duration-300 ease-out rounded-t-3xl lg:rounded-none h-[82vh] lg:h-full ${
          isMobileCartOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
        }`}
      >
        {/* Mobile Drag/Close Bar */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/80 rounded-t-3xl">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-amber-600" />
            <span className="font-black text-sm text-gray-800">Phiếu Order ({totalQuantity} món)</span>
          </div>
          <button 
            onClick={() => setIsMobileCartOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Desktop Cart Header */}
        <div className="hidden lg:flex p-4 border-b border-gray-100 items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-800">Phiếu Order Takeaway</h2>
            <p className="text-xs text-gray-400 font-medium">Tên khách & chi tiết tùy chọn pha chế</p>
          </div>
          {cart.length > 0 && (
            <span className="bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold ml-auto">
              {totalQuantity} món
            </span>
          )}
        </div>

        {/* Customer Name & Note Inputs */}
        <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/60 space-y-2.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-amber-600" />
                <span>Tên khách hàng</span>
              </label>
              <span className="text-[11px] text-gray-400">Dùng gọi món</span>
            </div>

            <input
              type="text"
              placeholder="Nhập tên khách (VD: Anh Nam, Chị Lan)..."
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs"
            />

            {/* Quick Name Suggestions */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {QUICK_NAMES.map(name => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCustomerName(name)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                    customerName === name
                      ? 'bg-amber-500 text-white font-bold'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Ghi chú chung cả đơn: mang đi túi riêng, vội..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>
        
        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-gray-50/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Coffee size={22} className="text-gray-300" />
              </div>
              <p className="text-gray-400 text-xs font-medium">Chưa chọn món nào</p>
              <p className="text-[11px] text-gray-400 max-w-[200px] text-center">
                Bấm vào các món bên trái để chọn tùy chọn pha chế
              </p>
            </div>
          ) : (
            cart.map(item => {
              const itemId = item.cartItemId || item.id;
              const hasOptions = item.options && (item.options.sweetener || item.options.milkTemp || item.options.sweetness || item.options.itemNote);

              return (
                <div 
                  key={itemId} 
                  className="bg-white p-3 rounded-2xl border border-gray-200/90 shadow-2xs hover:border-amber-300 transition-all flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-gray-800 text-xs sm:text-sm truncate">{item.name}</h4>
                        {item.options?.size && (
                          <span className={`px-1.5 py-0.2 rounded font-black text-[10px] uppercase shrink-0 ${
                            item.options.size === 'L' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            Size {item.options.size}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenCustomize(item, item)}
                          className="text-gray-400 hover:text-amber-600 p-0.5 rounded transition-colors"
                          title="Sửa lựa chọn món này"
                        >
                          <SlidersHorizontal size={13} />
                        </button>
                      </div>
                      <div className="text-xs font-bold text-amber-600 mt-0.5">
                        {formatCurrency(item.price)} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-200 shrink-0">
                      <button 
                        onClick={() => updateQuantity(itemId, -1)} 
                        className="p-1 hover:bg-white rounded-lg text-gray-600 transition-colors"
                      >
                        {item.quantity === 1 ? <Trash2 size={13} className="text-red-500" /> : <Minus size={13} />}
                      </button>
                      <span className="w-5 text-center font-black text-xs text-gray-800">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(itemId, 1)} 
                        className="p-1 hover:bg-white rounded-lg text-gray-600 transition-colors"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Badges for selected options: Sweetener, Milk/Temp, Sweetness */}
                  {hasOptions && (
                    <div className="pt-1.5 border-t border-gray-100 flex flex-wrap items-center gap-1 text-[11px]">
                      {item.options?.size && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold ${
                          item.options.size === 'L' ? 'bg-purple-50 text-purple-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          Size {item.options.size}
                        </span>
                      )}

                      {item.options?.milkTemp && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold">
                          {item.options.milkTemp.includes('Lạnh') ? <Snowflake size={11} /> : <Flame size={11} />}
                          <span>{item.options.milkTemp}</span>
                        </span>
                      )}

                      {item.options?.sweetener && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold">
                          Chất ngọt: {item.options.sweetener}
                        </span>
                      )}

                      {item.options?.sweetness && (
                        <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 font-semibold">
                          Độ ngọt: {item.options.sweetness}
                        </span>
                      )}

                      {item.options?.itemNote && (
                        <span className="w-full text-[11px] text-amber-900 bg-amber-50/70 px-2 py-0.5 rounded-md font-medium">
                          Ghi chú: {item.options.itemNote}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Action Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-gray-600 text-xs sm:text-sm">
              Khách: <strong className="text-gray-900">{finalCustomerName}</strong>
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600">{formatCurrency(total)}</span>
          </div>
          
          <button
            onClick={handleSendOrder}
            disabled={cart.length === 0 || isSending}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 text-white font-extrabold text-sm sm:text-base py-3 rounded-xl transition-all shadow-md shadow-orange-200 flex items-center justify-center gap-2 touch-manipulation"
          >
            {isSending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Send size={17} />
                <span>Gửi order vào bếp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile Cart */}
      {isMobileCartOpen && (
        <div 
          onClick={() => setIsMobileCartOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-30 transition-opacity"
        />
      )}

      {/* Admin Menu Item Modal */}
      {userRole === 'admin' && onSaveMenuItem && (
        <MenuItemModal
          isOpen={isMenuModalOpen}
          onClose={() => {
            setIsMenuModalOpen(false);
            setEditingMenuItem(null);
          }}
          item={editingMenuItem}
          categories={Array.from(new Set(['Cà phê', 'Trà', 'Trà sữa', 'Sinh tố', 'Nước ép', 'Đồ ăn nhẹ', ...menu.map(m => m.category)]))}
          onSave={handleAdminSaveMenuItem}
          onDelete={onDeleteMenuItem ? handleAdminDeleteMenuItem : undefined}
        />
      )}

      {/* Admin Delete Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-base sm:text-lg font-black text-gray-900">Xóa món khỏi thực đơn?</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Bạn có chắc chắn muốn xóa món <span className="font-bold text-gray-900">"{itemToDelete.name}"</span>? Món sẽ bị gỡ bỏ vĩnh viễn khỏi hệ thống.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeletingItem}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs sm:text-sm hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                disabled={isDeletingItem}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-200 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {isDeletingItem ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Xác nhận xóa</span>
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
