import { useState, FormEvent, ChangeEvent, useRef } from 'react';
import { MenuItem, Order, AppUser, PaymentSettings, PreparationOptionsSettings, OptionChoice } from '../types';
import { formatCurrency, VIETNAMESE_BANKS, defaultPaymentSettings, defaultPreparationOptions } from '../data';
import MenuItemModal from './MenuItemModal';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  History, 
  Utensils, 
  X, 
  Search, 
  AlertCircle, 
  Users, 
  Shield, 
  User as UserIcon,
  QrCode,
  SlidersHorizontal,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  Flame,
  Snowflake,
  Coffee,
  Check,
  HelpCircle,
  Sliders
} from 'lucide-react';

interface AdminTabProps {
  menu: MenuItem[];
  onUpdateMenu: (menu: MenuItem[]) => void;
  onSaveMenuItem?: (item: MenuItem) => Promise<void>;
  onDeleteMenuItem?: (id: string) => Promise<void>;
  orders: Order[];
  onClearOrders: () => void;
  users: AppUser[];
  onUpdateUserRole: (uid: string, role: 'admin' | 'staff') => void;
  onCreateUser: (username: string, pass: string, role: 'admin' | 'staff', name: string) => Promise<void>;
  onDeleteUser?: (uid: string) => Promise<void>;
  currentUserId: string;
  paymentSettings?: PaymentSettings;
  onUpdatePaymentSettings: (settings: PaymentSettings) => Promise<void>;
  optionsSettings?: PreparationOptionsSettings;
  onUpdateOptionsSettings: (settings: PreparationOptionsSettings) => Promise<void>;
}

export default function AdminTab({
  menu,
  onUpdateMenu,
  onSaveMenuItem,
  onDeleteMenuItem,
  orders,
  onClearOrders,
  users,
  onUpdateUserRole,
  onCreateUser,
  onDeleteUser,
  currentUserId,
  paymentSettings = defaultPaymentSettings,
  onUpdatePaymentSettings,
  optionsSettings = defaultPreparationOptions,
  onUpdateOptionsSettings
}: AdminTabProps) {
  const [activeSection, setActiveSection] = useState<'menu' | 'qr' | 'options' | 'history' | 'users'>('menu');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [itemActionToast, setItemActionToast] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');

  // User Creation State
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({ username: '', password: '', role: 'staff' as 'admin'|'staff', name: '' });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState('');

  // User Deletion State
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');
  const [userActionToast, setUserActionToast] = useState('');

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete || !onDeleteUser) return;
    setIsDeletingUser(true);
    setDeleteUserError('');
    try {
      await onDeleteUser(userToDelete.uid);
      const name = userToDelete.displayName || userToDelete.username || userToDelete.email || 'nhân viên';
      setUserToDelete(null);
      setUserActionToast(`Đã xóa tài khoản "${name}" thành công!`);
      setTimeout(() => setUserActionToast(''), 4000);
    } catch (err: any) {
      setDeleteUserError(err.message || 'Không thể xóa tài khoản, vui lòng thử lại.');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // QR Settings Local State
  const [qrSettings, setQrSettings] = useState<PaymentSettings>({
    bankId: paymentSettings?.bankId || 'MB',
    bankName: paymentSettings?.bankName || 'MBBank (Ngân hàng Quân Đội)',
    accountNo: paymentSettings?.accountNo || '0988888888',
    accountName: paymentSettings?.accountName || 'QUAN POS MINI',
    qrType: paymentSettings?.qrType || 'vietqr',
    qrImageUrl: paymentSettings?.qrImageUrl || '',
    notePrefix: paymentSettings?.notePrefix || 'DH',
  });
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [qrSuccessMessage, setQrSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preparation Options Local State
  const [prepOptions, setPrepOptions] = useState<PreparationOptionsSettings>({
    sweeteners: optionsSettings?.sweeteners ? [...optionsSettings.sweeteners] : [...defaultPreparationOptions.sweeteners],
    milkTemps: optionsSettings?.milkTemps ? [...optionsSettings.milkTemps] : [...defaultPreparationOptions.milkTemps],
    sweetnessLevels: optionsSettings?.sweetnessLevels ? [...optionsSettings.sweetnessLevels] : [...defaultPreparationOptions.sweetnessLevels],
    quickNotes: optionsSettings?.quickNotes ? [...optionsSettings.quickNotes] : [...defaultPreparationOptions.quickNotes],
  });
  const [isSavingOptions, setIsSavingOptions] = useState(false);
  const [optionsSuccessMessage, setOptionsSuccessMessage] = useState('');

  // Temporary inputs for adding new options
  const [newSweetener, setNewSweetener] = useState({ label: '', desc: '' });
  const [newMilkTemp, setNewMilkTemp] = useState<{ label: string; type: 'cold' | 'hot' | 'warm' | 'none' }>({ label: '', type: 'cold' });
  const [newSweetness, setNewSweetness] = useState({ label: '', desc: '' });
  const [newQuickNote, setNewQuickNote] = useState('');

  // Handle User creation
  const handleCreateUserSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    const cleanUsername = userFormData.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      setUserFormError('Tên đăng nhập phải có ít nhất 3 ký tự (chữ thường a-z, số 0-9, dấu gạch _ hoặc .)');
      return;
    }
    if (userFormData.password.length < 6) {
      setUserFormError('Mật khẩu ban đầu phải có ít nhất 6 ký tự.');
      return;
    }

    setUserFormLoading(true);
    try {
      await onCreateUser(cleanUsername, userFormData.password, userFormData.role, userFormData.name.trim());
      setIsUserFormOpen(false);
      setUserFormData({ username: '', password: '', role: 'staff', name: '' });
    } catch (err: any) {
      setUserFormError(err.message);
    } finally {
      setUserFormLoading(false);
    }
  };

  // Open menu item form
  const handleOpenForm = (item?: MenuItem) => {
    setEditingItem(item || null);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (itemData: MenuItem) => {
    if (onSaveMenuItem) {
      await onSaveMenuItem(itemData);
    } else {
      if (editingItem) {
        onUpdateMenu(menu.map(i => i.id === editingItem.id ? itemData : i));
      } else {
        onUpdateMenu([itemData, ...menu]);
      }
    }
    setItemActionToast(editingItem ? `Đã cập nhật món "${itemData.name}" thành công!` : `Đã thêm món "${itemData.name}" vào thực đơn!`);
    setTimeout(() => setItemActionToast(''), 4000);
  };

  const handleDeleteItem = async (id: string) => {
    const item = menu.find(m => m.id === id);
    if (onDeleteMenuItem) {
      await onDeleteMenuItem(id);
    } else {
      onUpdateMenu(menu.filter(i => i.id !== id));
    }
    setItemActionToast(`Đã xóa món "${item?.name || id}" khỏi thực đơn!`);
    setTimeout(() => setItemActionToast(''), 4000);
  };

  const handlePromptDelete = (item: MenuItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await handleDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    } catch (err: any) {
      alert('Lỗi khi xóa món: ' + (err?.message || 'Thử lại sau'));
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử đơn hàng và doanh thu không? Hành động này không thể hoàn tác.')) {
      onClearOrders();
    }
  };

  // QR Code Management Handlers
  const handleBankChange = (bankId: string) => {
    const found = VIETNAMESE_BANKS.find(b => b.id === bankId);
    setQrSettings(prev => ({
      ...prev,
      bankId,
      bankName: found ? found.name : bankId
    }));
  };

  const handleQrImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh (PNG, JPG, JPEG, WEBP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Dung lượng hình ảnh quá lớn (tối đa 2MB). Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setQrSettings(prev => ({
          ...prev,
          qrImageUrl: result,
          qrType: 'custom_image'
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveQrSettings = async () => {
    setIsSavingQr(true);
    setQrSuccessMessage('');
    try {
      await onUpdatePaymentSettings(qrSettings);
      setQrSuccessMessage('Đã cập nhật thông tin và mã QR thanh toán thành công!');
      setTimeout(() => setQrSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi lưu mã QR: ' + (err.message || 'Thử lại sau'));
    } finally {
      setIsSavingQr(false);
    }
  };

  // Preparation Options Management Handlers
  const handleAddSweetener = () => {
    if (!newSweetener.label.trim()) return;
    setPrepOptions(prev => ({
      ...prev,
      sweeteners: [...prev.sweeteners, { label: newSweetener.label.trim(), desc: newSweetener.desc.trim() }]
    }));
    setNewSweetener({ label: '', desc: '' });
  };

  const handleRemoveSweetener = (index: number) => {
    if (prepOptions.sweeteners.length <= 1) {
      alert('Cần có ít nhất 1 tùy chọn chất làm ngọt!');
      return;
    }
    setPrepOptions(prev => ({
      ...prev,
      sweeteners: prev.sweeteners.filter((_, i) => i !== index)
    }));
  };

  const handleAddMilkTemp = () => {
    if (!newMilkTemp.label.trim()) return;
    setPrepOptions(prev => ({
      ...prev,
      milkTemps: [...prev.milkTemps, { label: newMilkTemp.label.trim(), type: newMilkTemp.type }]
    }));
    setNewMilkTemp({ label: '', type: 'cold' });
  };

  const handleRemoveMilkTemp = (index: number) => {
    if (prepOptions.milkTemps.length <= 1) {
      alert('Cần có ít nhất 1 tùy chọn Sữa/Nhiệt độ!');
      return;
    }
    setPrepOptions(prev => ({
      ...prev,
      milkTemps: prev.milkTemps.filter((_, i) => i !== index)
    }));
  };

  const handleAddSweetness = () => {
    if (!newSweetness.label.trim()) return;
    setPrepOptions(prev => ({
      ...prev,
      sweetnessLevels: [...prev.sweetnessLevels, { label: newSweetness.label.trim(), desc: newSweetness.desc.trim() }]
    }));
    setNewSweetness({ label: '', desc: '' });
  };

  const handleRemoveSweetness = (index: number) => {
    if (prepOptions.sweetnessLevels.length <= 1) {
      alert('Cần có ít nhất 1 mức độ ngọt!');
      return;
    }
    setPrepOptions(prev => ({
      ...prev,
      sweetnessLevels: prev.sweetnessLevels.filter((_, i) => i !== index)
    }));
  };

  const handleAddQuickNote = () => {
    if (!newQuickNote.trim()) return;
    const note = newQuickNote.trim();
    if (!prepOptions.quickNotes.includes(note)) {
      setPrepOptions(prev => ({
        ...prev,
        quickNotes: [...prev.quickNotes, note]
      }));
    }
    setNewQuickNote('');
  };

  const handleRemoveQuickNote = (note: string) => {
    setPrepOptions(prev => ({
      ...prev,
      quickNotes: prev.quickNotes.filter(n => n !== note)
    }));
  };

  const handleResetToDefaultOptions = () => {
    if (confirm('Khôi phục danh sách tùy chọn pha chế về mặc định chuẩn ban đầu?')) {
      setPrepOptions({
        sweeteners: [...defaultPreparationOptions.sweeteners],
        milkTemps: [...defaultPreparationOptions.milkTemps],
        sweetnessLevels: [...defaultPreparationOptions.sweetnessLevels],
        quickNotes: [...defaultPreparationOptions.quickNotes],
      });
    }
  };

  const handleSaveOptionsSettings = async () => {
    setIsSavingOptions(true);
    setOptionsSuccessMessage('');
    try {
      await onUpdateOptionsSettings(prepOptions);
      setOptionsSuccessMessage('Đã lưu cấu hình tùy chọn pha chế thành công!');
      setTimeout(() => setOptionsSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi lưu tùy chọn pha chế: ' + (err.message || 'Thử lại sau'));
    } finally {
      setIsSavingOptions(false);
    }
  };

  const filteredMenu = menu.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute live VietQR preview url
  const previewBankId = qrSettings.bankId || 'MB';
  const previewAcc = qrSettings.accountNo || '0988888888';
  const previewName = qrSettings.accountName || 'QUAN POS MINI';
  const previewPrefix = qrSettings.notePrefix || 'DH';
  const previewVietQrUrl = `https://img.vietqr.io/image/${previewBankId}-${previewAcc}-compact2.png?amount=45000&addInfo=${encodeURIComponent(previewPrefix + ' 1024')}&accountName=${encodeURIComponent(previewName)}`;

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Admin Navigation Bar - Touch-optimized on mobile */}
      <div className="bg-white border-b border-gray-200 p-2 sm:p-3 lg:px-8 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shadow-2xs z-10 shrink-0 touch-pan-x">
        <button
          onClick={() => setActiveSection('menu')}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 touch-manipulation shrink-0 ${
            activeSection === 'menu' 
              ? 'bg-gray-900 text-white shadow-xs' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Utensils size={15} />
          <span>Thực đơn ({menu.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('qr')}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 touch-manipulation shrink-0 ${
            activeSection === 'qr' 
              ? 'bg-gray-900 text-white shadow-xs' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <QrCode size={15} />
          <span>Mã QR thanh toán</span>
        </button>

        <button
          onClick={() => setActiveSection('options')}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 touch-manipulation shrink-0 ${
            activeSection === 'options' 
              ? 'bg-gray-900 text-white shadow-xs' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <SlidersHorizontal size={15} />
          <span>Tùy chọn pha chế</span>
        </button>

        <button
          onClick={() => setActiveSection('history')}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 touch-manipulation shrink-0 ${
            activeSection === 'history' 
              ? 'bg-gray-900 text-white shadow-xs' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <History size={15} />
          <span>Lịch sử đơn ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('users')}
          className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95 touch-manipulation shrink-0 ${
            activeSection === 'users' 
              ? 'bg-gray-900 text-white shadow-xs' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Users size={15} />
          <span>Nhân viên ({users.length})</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">

          {/* 1. MENU MANAGEMENT */}
          {activeSection === 'menu' && (
            <div className="space-y-3 sm:space-y-5">
              {/* Action Toast Notification */}
              {itemActionToast && (
                <div className="p-3.5 sm:p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold shadow-xs animate-in fade-in">
                  <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                  <span>{itemActionToast}</span>
                </div>
              )}

              {/* Search and Add Button - Mobile Full Width */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="text-gray-400" size={17} />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm kiếm món hoặc danh mục..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2.5 sm:py-2.5 w-full border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all shadow-2xs bg-white min-h-[44px]"
                  />
                </div>
                <button
                  onClick={() => handleOpenForm()}
                  className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-200 active:scale-98 touch-manipulation min-h-[44px] shrink-0"
                >
                  <Plus size={18} />
                  <span>Thêm món mới</span>
                </button>
              </div>

              {/* Mobile View: High-density Touch Cards */}
              <div className="sm:hidden space-y-2.5">
                {filteredMenu.length === 0 ? (
                  <div className="bg-white p-8 text-center text-gray-500 rounded-2xl border border-gray-200 text-xs shadow-2xs">
                    Không tìm thấy món nào phù hợp.
                  </div>
                ) : (
                  filteredMenu.map(item => (
                    <div 
                      key={item.id} 
                      className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs flex items-center justify-between gap-3 active:bg-gray-50/50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-bold text-[10px] rounded-md">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-amber-600 text-sm">
                            {formatCurrency(item.price)}
                          </span>
                          {item.hasOptions !== false ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                              <SlidersHorizontal size={10} />
                              <span>Có tùy chọn</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md">
                              Món làm sẵn
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenForm(item)}
                          className="w-10 h-10 flex items-center justify-center text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-90 rounded-xl transition-all"
                          title="Sửa món"
                          aria-label="Sửa món"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handlePromptDelete(item)}
                          className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 active:scale-90 rounded-xl transition-all"
                          title="Xóa món"
                          aria-label="Xóa món"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop/Tablet View: Structured Table */}
              <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[550px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-3 sm:p-4 font-semibold">Tên món</th>
                        <th className="p-3 sm:p-4 font-semibold">Danh mục</th>
                        <th className="p-3 sm:p-4 font-semibold">Tùy chọn pha chế</th>
                        <th className="p-3 sm:p-4 font-semibold">Giá bán</th>
                        <th className="p-3 sm:p-4 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                      {filteredMenu.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            Không tìm thấy món nào.
                          </td>
                        </tr>
                      ) : (
                        filteredMenu.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 sm:p-4 font-semibold text-gray-800">{item.name}</td>
                            <td className="p-3 sm:p-4">
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 font-medium text-[11px] rounded-lg">
                                {item.category}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4">
                              {item.hasOptions !== false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[11px] rounded-lg">
                                  <SlidersHorizontal size={12} />
                                  <span>Có tùy chọn</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 font-medium text-[11px] rounded-lg">
                                  <span>Món sẵn (không pha)</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 sm:p-4 font-bold text-gray-900">{formatCurrency(item.price)}</td>
                            <td className="p-3 sm:p-4 text-right">
                              <div className="flex items-center justify-end gap-1 sm:gap-2">
                                <button
                                  onClick={() => handleOpenForm(item)}
                                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Sửa"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handlePromptDelete(item)}
                                  className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. QR CODE SETTINGS MANAGEMENT */}
          {activeSection === 'qr' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <QrCode size={16} />
                    <span>Cấu hình thanh toán chuyển khoản</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-gray-900 mt-1">
                    Mã QR thanh toán
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Thay đổi thông tin ngân hàng hoặc tải lên ảnh mã QR riêng để hiển thị khi tính tiền.
                  </p>
                </div>

                <button
                  onClick={handleSaveQrSettings}
                  disabled={isSavingQr}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-5 py-3 rounded-xl font-extrabold text-sm shadow-md shadow-amber-200 transition-all disabled:opacity-50 min-h-[44px] shrink-0"
                >
                  {isSavingQr ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Lưu cấu hình mã QR</span>
                    </>
                  )}
                </button>
              </div>

              {/* Success Notification */}
              {qrSuccessMessage && (
                <div className="p-3.5 sm:p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold shadow-xs animate-in fade-in">
                  <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                  <span>{qrSuccessMessage}</span>
                </div>
              )}

              {/* QR Settings Form & Live Preview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                
                {/* Form Controls (Left column) */}
                <div className="lg:col-span-7 space-y-4 sm:space-y-5 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                      Loại mã QR thanh toán
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setQrSettings(prev => ({ ...prev, qrType: 'vietqr' }))}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-98 ${
                          qrSettings.qrType !== 'custom_image'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs sm:text-sm text-gray-900">VietQR Tự Động</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Khuyên dùng
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Tự động tạo mã QR có số tiền và mã đơn hàng mỗi lần tính tiền.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrSettings(prev => ({ ...prev, qrType: 'custom_image' }))}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-98 ${
                          qrSettings.qrType === 'custom_image'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-200'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs sm:text-sm text-gray-900">Ảnh QR Của Quán</span>
                          <span className="text-[10px] font-semibold text-gray-500">
                            MoMo / Tĩnh
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          Tải lên ảnh mã QR in sẵn từ MoMo, ZaloPay hoặc mã ngân hàng cố định.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* VietQR specific fields */}
                  {qrSettings.qrType !== 'custom_image' ? (
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Ngân hàng thụ hưởng
                        </label>
                        <select
                          value={qrSettings.bankId || 'MB'}
                          onChange={e => handleBankChange(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white font-medium text-gray-800 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs min-h-[44px]"
                        >
                          {VIETNAMESE_BANKS.map(bank => (
                            <option key={bank.id} value={bank.id}>
                              {bank.name} ({bank.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Số tài khoản nhận tiền
                          </label>
                          <input
                            type="text"
                            required
                            value={qrSettings.accountNo || ''}
                            onChange={e => setQrSettings(prev => ({ ...prev, accountNo: e.target.value.replace(/\s+/g, '') }))}
                            placeholder="Ví dụ: 0988888888"
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs min-h-[44px]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Tên chủ tài khoản
                          </label>
                          <input
                            type="text"
                            required
                            value={qrSettings.accountName || ''}
                            onChange={e => setQrSettings(prev => ({ ...prev, accountName: e.target.value.toUpperCase() }))}
                            placeholder="Ví dụ: NGUYEN XUAN TUYEN"
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-bold uppercase text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs min-h-[44px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Tiền tố nội dung chuyển khoản
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={qrSettings.notePrefix || 'DH'}
                            onChange={e => setQrSettings(prev => ({ ...prev, notePrefix: e.target.value.toUpperCase().trim() }))}
                            placeholder="DH"
                            maxLength={10}
                            className="w-28 border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm font-mono font-bold uppercase text-amber-700 focus:ring-2 focus:ring-amber-500 outline-none shadow-2xs min-h-[44px]"
                          />
                          <span className="text-xs text-gray-500">
                            Ví dụ khách quét: <strong>{qrSettings.notePrefix || 'DH'} 1024</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Custom Image Upload */
                    <div className="space-y-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          Tải lên ảnh mã QR
                        </label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleQrImageUpload}
                          className="hidden"
                        />
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 hover:border-amber-500 bg-gray-50/50 hover:bg-amber-50/20 rounded-2xl p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 active:scale-98 touch-manipulation"
                        >
                          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Upload size={22} />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-800">
                              Chạm vào đây để chọn ảnh mã QR từ điện thoại
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Hỗ trợ JPG, PNG, WEBP (ảnh chụp màn hình mã MoMo, ZaloPay hoặc mã ngân hàng)
                            </p>
                          </div>
                        </div>
                      </div>

                      {qrSettings.qrImageUrl && (
                        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={qrSettings.qrImageUrl} 
                              alt="Uploaded QR" 
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-gray-800 block truncate">Đã tải lên ảnh mã QR</span>
                              <p className="text-[11px] text-green-600 font-semibold">Sẵn sàng sử dụng</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQrSettings(prev => ({ ...prev, qrImageUrl: '' }))}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                          >
                            <Trash2 size={15} />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Live Preview (Right column) */}
                <div className="lg:col-span-5 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs flex flex-col items-center text-center">
                  <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-gray-100 text-xs">
                    <span className="font-bold text-gray-500 uppercase tracking-wider">Xem trước khi thu tiền</span>
                    <span className="font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Trực quan
                    </span>
                  </div>

                  <div className="w-full max-w-[280px] bg-gray-50 p-3.5 sm:p-4 rounded-2xl border border-gray-200 space-y-3">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs flex items-center justify-center min-h-[190px]">
                      {qrSettings.qrType === 'custom_image' && qrSettings.qrImageUrl ? (
                        <img 
                          src={qrSettings.qrImageUrl} 
                          alt="Xem trước QR" 
                          className="max-h-[180px] w-auto object-contain rounded-lg mx-auto"
                        />
                      ) : (
                        <img 
                          src={previewVietQrUrl} 
                          alt="Xem trước VietQR" 
                          className="max-h-[180px] w-auto object-contain rounded-lg mx-auto"
                        />
                      )}
                    </div>

                    <div className="text-left bg-white p-3 rounded-xl border border-gray-100 text-xs space-y-1">
                      <div className="flex justify-between items-center text-gray-900 font-bold">
                        <span>Số tiền thử nghiệm:</span>
                        <span className="text-sm font-black text-amber-600">45.000 ₫</span>
                      </div>

                      {qrSettings.qrType !== 'custom_image' ? (
                        <>
                          <div className="flex justify-between text-[11px] pt-1 border-t border-gray-100">
                            <span className="text-gray-500">Ngân hàng:</span>
                            <span className="font-bold text-gray-800">{previewBankId}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Số tài khoản:</span>
                            <span className="font-mono font-bold text-gray-900">{previewAcc}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Chủ tài khoản:</span>
                            <span className="font-bold uppercase text-gray-900">{previewName}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-500">Nội dung CK:</span>
                            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-1 rounded">
                              {previewPrefix} 1024
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                          Khách quét mã này trên ứng dụng ngân hàng hoặc ví điện tử
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-3 sm:mt-4 max-w-xs">
                    Mã này sẽ hiển thị trực tiếp cho khách hoặc nhân viên quét thanh toán tại tab <strong>Thu tiền</strong>.
                  </p>
                </div>

              </div>
            </div>
          )}

          {/* 3. PREPARATION OPTIONS MANAGEMENT */}
          {activeSection === 'options' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
                    <SlidersHorizontal size={16} />
                    <span>Cấu hình công thức & tùy chọn món</span>
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-gray-900 mt-1">
                    Sửa chữa tùy chọn món
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    Quản lý danh sách Chất làm ngọt, Sữa & Nhiệt độ, Mức độ ngọt và Ghi chú nhanh khi gọi món.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleResetToDefaultOptions}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-xs transition-colors min-h-[44px]"
                  >
                    <RotateCcw size={14} />
                    <span>Khôi phục</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveOptionsSettings}
                    disabled={isSavingOptions}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-5 py-2.5 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm shadow-md shadow-amber-200 transition-all disabled:opacity-50 min-h-[44px]"
                  >
                    {isSavingOptions ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Save size={17} />
                        <span>Lưu tùy chọn</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Success Notification */}
              {optionsSuccessMessage && (
                <div className="p-3.5 sm:p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-bold shadow-xs animate-in fade-in">
                  <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                  <span>{optionsSuccessMessage}</span>
                </div>
              )}

              {/* 4 Cards Grid for the 4 option categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                {/* 3.1. CHẤT LÀM NGỌT (Sweeteners) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                          1
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">Chất làm ngọt</h3>
                          <p className="text-[11px] text-gray-500">Đường cát, đường kiêng, sữa đặc, mật ong...</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        {prepOptions.sweeteners.length} loại
                      </span>
                    </div>

                    {/* Current list */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {prepOptions.sweeteners.map((sw, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                          <div>
                            <span className="font-bold text-gray-800">{sw.label}</span>
                            {sw.desc && <span className="text-[11px] text-gray-500 ml-1.5">({sw.desc})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSweetener(idx)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add form - Responsive Stack for Mobile */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Thêm chất làm ngọt mới</span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Tên (vd: Siro vani)"
                        value={newSweetener.label}
                        onChange={e => setNewSweetener(prev => ({ ...prev, label: e.target.value }))}
                        className="sm:col-span-6 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[42px]"
                      />
                      <input
                        type="text"
                        placeholder="Mô tả ngắn (vd: Thơm dịu)"
                        value={newSweetener.desc}
                        onChange={e => setNewSweetener(prev => ({ ...prev, desc: e.target.value }))}
                        className="sm:col-span-4 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddSweetener}
                        className="sm:col-span-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 min-h-[42px] active:scale-95"
                      >
                        <Plus size={15} />
                        <span className="sm:hidden">Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3.2. SỮA & NHIỆT ĐỘ (Milk & Temp) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                          2
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">Sữa & Nhiệt độ</h3>
                          <p className="text-[11px] text-gray-500">Đá lạnh, nóng, ấm, không sữa...</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {prepOptions.milkTemps.length} tùy chọn
                      </span>
                    </div>

                    {/* Current list */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {prepOptions.milkTemps.map((mt, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                          <div className="flex items-center gap-2">
                            {mt.type === 'cold' ? (
                              <Snowflake size={14} className="text-blue-500 shrink-0" />
                            ) : mt.type === 'hot' ? (
                              <Flame size={14} className="text-orange-500 shrink-0" />
                            ) : (
                              <Coffee size={14} className="text-gray-500 shrink-0" />
                            )}
                            <span className="font-bold text-gray-800">{mt.label}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                              {mt.type === 'cold' ? 'Lạnh' : mt.type === 'hot' ? 'Nóng' : mt.type === 'warm' ? 'Ấm' : 'Thường'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMilkTemp(idx)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add form - Responsive Stack for Mobile */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Thêm nhiệt độ/sữa mới</span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Tên (vd: Sữa tươi nóng)"
                        value={newMilkTemp.label}
                        onChange={e => setNewMilkTemp(prev => ({ ...prev, label: e.target.value }))}
                        className="sm:col-span-6 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[42px]"
                      />
                      <select
                        value={newMilkTemp.type}
                        onChange={e => setNewMilkTemp(prev => ({ ...prev, type: e.target.value as any }))}
                        className="sm:col-span-4 border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-amber-500 outline-none min-h-[42px]"
                      >
                        <option value="cold">Lạnh (Đá)</option>
                        <option value="hot">Nóng</option>
                        <option value="warm">Ấm</option>
                        <option value="none">Không đá / thường</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddMilkTemp}
                        className="sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 min-h-[42px] active:scale-95"
                      >
                        <Plus size={15} />
                        <span className="sm:hidden">Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3.3. MỨC ĐỘ NGỌT (Sweetness Levels) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs">
                          3
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">Mức độ ngọt</h3>
                          <p className="text-[11px] text-gray-500">100% ngọt, 70% ngọt, 50%, 30%, không ngọt...</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {prepOptions.sweetnessLevels.length} mức
                      </span>
                    </div>

                    {/* Current list */}
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {prepOptions.sweetnessLevels.map((swl, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                          <div>
                            <span className="font-bold text-gray-800">{swl.label}</span>
                            {swl.desc && <span className="text-[11px] text-gray-500 ml-1.5">({swl.desc})</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSweetness(idx)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add form - Responsive Stack for Mobile */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Thêm mức độ ngọt mới</span>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Mức ngọt (vd: 80% ngọt)"
                        value={newSweetness.label}
                        onChange={e => setNewSweetness(prev => ({ ...prev, label: e.target.value }))}
                        className="sm:col-span-6 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[42px]"
                      />
                      <input
                        type="text"
                        placeholder="Mô tả (vd: Hơi ngọt nhẹ)"
                        value={newSweetness.desc}
                        onChange={e => setNewSweetness(prev => ({ ...prev, desc: e.target.value }))}
                        className="sm:col-span-4 border border-gray-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddSweetness}
                        className="sm:col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 min-h-[42px] active:scale-95"
                      >
                        <Plus size={15} />
                        <span className="sm:hidden">Thêm</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3.4. GHI CHÚ NHANH (Quick Note Chips) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                          4
                        </span>
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">Ghi chú nhanh khi gọi món</h3>
                          <p className="text-[11px] text-gray-500">Các nút bấm nhanh: Ít đá, Không đá, Đá riêng, Ly giấy...</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                        {prepOptions.quickNotes.length} gợi ý
                      </span>
                    </div>

                    {/* Chips list */}
                    <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                      {prepOptions.quickNotes.map((note, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 font-bold text-xs border border-purple-100"
                        >
                          <span>{note}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuickNote(note)}
                            className="p-1 text-purple-400 hover:text-red-600 transition-colors"
                            title="Xóa gợi ý"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Add note chip */}
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">Thêm gợi ý ghi chú mới</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ví dụ: Đậm vị, Ít đá, Mang về gấp..."
                        value={newQuickNote}
                        onChange={e => setNewQuickNote(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddQuickNote();
                          }
                        }}
                        className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={handleAddQuickNote}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shrink-0 min-h-[42px] active:scale-95"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 4. ORDER HISTORY */}
          {activeSection === 'history' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base">Lịch sử toàn bộ đơn hàng</h3>
                  <p className="text-xs text-gray-500">Tổng cộng {orders.length} đơn hàng trong hệ thống</p>
                </div>
                <button
                  onClick={handleClearHistory}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto min-h-[40px] active:scale-95"
                >
                  <AlertCircle size={15} />
                  <span>Xóa lịch sử</span>
                </button>
              </div>

              {/* Mobile View: Order Cards */}
              <div className="sm:hidden space-y-2.5">
                {orders.length === 0 ? (
                  <div className="bg-white p-8 text-center text-gray-500 rounded-2xl border border-gray-200 text-xs shadow-2xs">
                    Chưa có đơn hàng nào
                  </div>
                ) : (
                  orders.slice(0, 50).map(order => (
                    <div key={order.id} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-gray-900 text-sm">#{order.id.slice(-4)}</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-700' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'in_kitchen' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status === 'completed' ? 'Đã hoàn tất' :
                           order.status === 'ready' ? 'Đã ra món' :
                           order.status === 'in_kitchen' ? 'Đang chế biến' : 'Đã hủy'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="font-semibold text-gray-800">{order.customerName || order.table || 'Mang về'}</span>
                        <span className="text-gray-400">{new Date(order.timestamp).toLocaleTimeString('vi-VN')} {new Date(order.timestamp).toLocaleDateString('vi-VN')}</span>
                      </div>

                      <div className="text-xs text-gray-500 line-clamp-1">
                        {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-xs">
                        <span className="text-[11px] text-gray-500 font-medium">
                          {order.paymentMethod === 'transfer' ? 'Chuyển khoản' : order.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chưa thu'}
                        </span>
                        <span className="font-bold text-amber-600 text-sm">{formatCurrency(order.total)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-3 sm:p-4 font-semibold">Mã đơn</th>
                        <th className="p-3 sm:p-4 font-semibold">Khách</th>
                        <th className="p-3 sm:p-4 font-semibold">Thời gian</th>
                        <th className="p-3 sm:p-4 font-semibold">Số món</th>
                        <th className="p-3 sm:p-4 font-semibold">Tổng tiền</th>
                        <th className="p-3 sm:p-4 font-semibold">Trạng thái</th>
                        <th className="p-3 sm:p-4 font-semibold">Thanh toán</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">Chưa có đơn hàng nào</td>
                        </tr>
                      ) : (
                        orders.slice(0, 50).map(order => (
                          <tr key={order.id} className="hover:bg-gray-50/50">
                            <td className="p-3 sm:p-4 font-mono font-bold text-gray-800">#{order.id.slice(-4)}</td>
                            <td className="p-3 sm:p-4 font-semibold text-gray-700">{order.customerName || order.table || 'Mang về'}</td>
                            <td className="p-3 sm:p-4 text-gray-500">{new Date(order.timestamp).toLocaleTimeString('vi-VN')} {new Date(order.timestamp).toLocaleDateString('vi-VN')}</td>
                            <td className="p-3 sm:p-4">{order.items.reduce((s, i) => s + i.quantity, 0)} món</td>
                            <td className="p-3 sm:p-4 font-bold text-amber-600">{formatCurrency(order.total)}</td>
                            <td className="p-3 sm:p-4">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                                order.status === 'in_kitchen' ? 'bg-orange-100 text-orange-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {order.status === 'completed' ? 'Đã hoàn tất' :
                                 order.status === 'ready' ? 'Đã ra món' :
                                 order.status === 'in_kitchen' ? 'Đang chế biến' : 'Đã hủy'}
                              </span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="text-[11px] font-medium text-gray-600">
                                {order.paymentMethod === 'transfer' ? 'Chuyển khoản' : order.paymentMethod === 'cash' ? 'Tiền mặt' : '—'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. USER MANAGEMENT */}
          {activeSection === 'users' && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base">Quản lý nhân viên & Phân quyền</h3>
                  <p className="text-xs text-gray-500">Chỉ quản trị viên mới có thể xem doanh thu và cấu hình hệ thống</p>
                </div>
                <button
                  onClick={() => setIsUserFormOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs min-h-[44px] active:scale-95"
                >
                  <Plus size={16} />
                  <span>Tạo tài khoản nhân viên</span>
                </button>
              </div>

              {/* Helpful onboard tip */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Shield size={16} />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-900">Cách cấp tài khoản cho nhân viên:</p>
                  <p className="text-amber-800 leading-relaxed">
                    1. Bấm nút <strong>"Tạo tài khoản nhân viên"</strong> ở trên để cấp nhanh Tên đăng nhập và Mật khẩu (nhân viên không cần có email).<br />
                    2. Hoặc nhân viên có thể bấm <strong>"Đăng nhập bằng Google"</strong>, tài khoản sẽ tự động xuất hiện ở danh sách để bạn phân quyền!
                  </p>
                </div>
              </div>

              {/* Action Toast / Feedback */}
              {userActionToast && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold px-4 py-3 rounded-2xl flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{userActionToast}</span>
                  </div>
                  <button type="button" onClick={() => setUserActionToast('')} className="p-1 text-emerald-600 hover:text-emerald-800 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Mobile View: User Cards */}
              <div className="sm:hidden space-y-2.5">
                {users.map(u => (
                  <div key={u.uid} className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                        {u.displayName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-sm truncate">{u.displayName || u.username || 'Nhân viên'}</span>
                          {u.uid === currentUserId && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                              Bạn
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          {u.username ? (
                            <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block">
                              @{u.username}
                            </span>
                          ) : u.email?.endsWith('@posmini.local') ? (
                            <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block">
                              @{u.email.replace('@posmini.local', '')}
                            </span>
                          ) : (
                            <p className="font-mono text-gray-500 text-xs truncate">{u.email}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 font-medium">Vai trò:</span>
                      <div className="flex items-center gap-2">
                        {u.uid === currentUserId ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800">
                            <Shield size={13} />
                            <span>Quản trị viên (Toàn quyền)</span>
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={e => onUpdateUserRole(u.uid, e.target.value as 'admin'|'staff')}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-amber-500 min-h-[40px]"
                          >
                            <option value="staff">Nhân viên (Gọi món & Phục vụ)</option>
                            <option value="admin">Quản trị viên (Toàn quyền)</option>
                          </select>
                        )}
                        {u.uid !== currentUserId && onDeleteUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserToDelete(u);
                              setDeleteUserError('');
                            }}
                            className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-xl transition-colors shrink-0 flex items-center gap-1 min-h-[40px]"
                            title="Xóa nhân viên"
                          >
                            <Trash2 size={15} />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="p-3 sm:p-4 font-semibold">Tài khoản / Tên</th>
                        <th className="p-3 sm:p-4 font-semibold">Tên đăng nhập / Email</th>
                        <th className="p-3 sm:p-4 font-semibold">Vai trò</th>
                        <th className="p-3 sm:p-4 font-semibold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                      {users.map(u => (
                        <tr key={u.uid} className="hover:bg-gray-50/50">
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                {u.displayName?.[0]?.toUpperCase() || u.username?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-gray-800">{u.displayName || u.username || 'Nhân viên'}</span>
                                {u.uid === currentUserId && (
                                  <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                                    Bạn
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4">
                            {u.username ? (
                              <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block">
                                @{u.username}
                              </span>
                            ) : u.email?.endsWith('@posmini.local') ? (
                              <span className="font-mono text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block">
                                @{u.email.replace('@posmini.local', '')}
                              </span>
                            ) : (
                              <span className="font-mono text-gray-600 text-xs">{u.email}</span>
                            )}
                          </td>
                          <td className="p-3 sm:p-4">
                            {u.uid === currentUserId ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                <Shield size={13} />
                                <span>Quản trị viên (Bạn)</span>
                              </span>
                            ) : (
                              <select
                                value={u.role}
                                onChange={e => onUpdateUserRole(u.uid, e.target.value as 'admin'|'staff')}
                                className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-amber-500"
                              >
                                <option value="staff">Nhân viên (Gọi món & Phục vụ)</option>
                                <option value="admin">Quản trị viên (Toàn quyền)</option>
                              </select>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-right">
                            {u.uid !== currentUserId && onDeleteUser ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setUserToDelete(u);
                                  setDeleteUserError('');
                                }}
                                className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors inline-flex items-center gap-1.5 active:scale-95"
                                title="Xóa tài khoản nhân viên này"
                              >
                                <Trash2 size={15} />
                                <span>Xóa</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Đang dùng</span>
                            )}
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
      </div>

      {/* Modal: Thêm / Sửa món bằng MenuItemModal */}
      <MenuItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        item={editingItem}
        categories={Array.from(new Set(['Cà phê', 'Trà', 'Trà sữa', 'Sinh tố', 'Nước ép', 'Đồ ăn nhẹ', ...menu.map(m => m.category)]))}
        onSave={handleSaveItem}
        onDelete={handleDeleteItem}
      />

      {/* Modal: Xác nhận xóa món */}
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

      {/* Modal: Tạo tài khoản nhân viên - Mobile Bottom-sheet & Desktop Centered */}
      {isUserFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Tạo tài khoản nhân viên</h3>
              <button 
                onClick={() => setIsUserFormOpen(false)} 
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full active:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUserSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {userFormError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                  {userFormError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={userFormData.name}
                  onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 font-mono font-bold text-sm select-none">@</span>
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="nhanvien1, thungan, banhang"
                    value={userFormData.username}
                    onChange={e => setUserFormData({...userFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '')})}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono min-h-[44px]"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Tên đăng nhập viết liền không dấu. Nhân viên dùng tên này và mật khẩu để đăng nhập POS Mini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mật khẩu ban đầu</label>
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={userFormData.password}
                  onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vai trò</label>
                <select
                  value={userFormData.role}
                  onChange={e => setUserFormData({...userFormData, role: e.target.value as 'admin'|'staff'})}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white min-h-[44px]"
                >
                  <option value="staff">Nhân viên (Gọi món & Phục vụ)</option>
                  <option value="admin">Quản trị viên (Toàn quyền)</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUserFormOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 text-sm min-h-[46px] active:scale-98"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={userFormLoading}
                  className="flex-1 px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-md text-sm disabled:opacity-50 min-h-[46px] active:scale-98"
                >
                  {userFormLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Delete User Confirmation Modal (Safe for iframes) */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Xác nhận xóa tài khoản</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Bạn có chắc muốn xóa tài khoản nhân viên này khỏi hệ thống? Dữ liệu tài khoản sẽ bị xóa hoàn toàn.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Họ và tên:</span>
                <span className="font-bold text-gray-900">{userToDelete.displayName || userToDelete.username || 'Nhân viên'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Tài khoản:</span>
                <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  {userToDelete.username ? `@${userToDelete.username}` : userToDelete.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Vai trò:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-200 text-gray-700">
                  {userToDelete.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                </span>
              </div>
            </div>

            {deleteUserError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{deleteUserError}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteUserError('');
                }}
                disabled={isDeletingUser}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 text-xs sm:text-sm min-h-[46px] active:scale-98"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-200 text-xs sm:text-sm min-h-[46px] active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <span>Đang xóa...</span>
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
