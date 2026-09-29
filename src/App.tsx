import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, sanitizeForFirestore } from './lib/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { AppUser, MenuItem, Order, CartItem, PaymentSettings, PreparationOptionsSettings, IngredientExpense } from './types';
import { initialMenu, defaultPaymentSettings, defaultPreparationOptions } from './data';
import Login from './components/Login';
import OrderTab from './components/OrderTab';
import KitchenTab from './components/KitchenTab';
import ServingTab from './components/ServingTab';
import RevenueTab from './components/RevenueTab';
import ProfitTab from './components/ProfitTab';
import AdminTab from './components/AdminTab';
import OrderHistoryTab from './components/OrderHistoryTab';
import { 
  Store, 
  Coffee, 
  ChefHat, 
  UtensilsCrossed, 
  DollarSign, 
  Settings, 
  LogOut,
  ShoppingBag,
  History,
  Coins
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'order' | 'kitchen' | 'serving' | 'history' | 'revenue' | 'profit' | 'admin'>('order');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<IngredientExpense[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [optionsSettings, setOptionsSettings] = useState<PreparationOptionsSettings>(defaultPreparationOptions);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Security guard: If non-admin tries to access admin settings, redirect to order
  useEffect(() => {
    if (user && user.role !== 'admin' && activeTab === 'admin') {
      setActiveTab('order');
    }
  }, [user, activeTab]);

  // Initialize and listen to Auth
  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Clean up previous user snapshot listener if any
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }

      if (currentUser) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        unsubUser = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const username = data.username || (currentUser.email?.endsWith('@posmini.local') ? currentUser.email.replace('@posmini.local', '') : undefined);
              const isOwnerAdmin = currentUser.email === 'nguyenxuantuyensadu@gmail.com' || (username && username.toLowerCase() === 'admin');
              setUser({
                uid: currentUser.uid,
                email: currentUser.email || '',
                username,
                role: isOwnerAdmin ? 'admin' : (data.role || 'staff'),
                displayName: currentUser.displayName || data.displayName || username || currentUser.email?.split('@')[0]
              });
            } else {
              const username = currentUser.email?.endsWith('@posmini.local') ? currentUser.email.replace('@posmini.local', '') : undefined;
              const isOwnerAdmin = currentUser.email === 'nguyenxuantuyensadu@gmail.com' || (username && username.toLowerCase() === 'admin');
              const newUser: AppUser = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                username,
                role: isOwnerAdmin ? 'admin' : 'staff',
                displayName: currentUser.displayName || username || currentUser.email?.split('@')[0] || 'Nhân viên'
              };
              setDoc(userDocRef, sanitizeForFirestore(newUser)).catch(() => {});
              setUser(newUser);
            }
            setAuthLoading(false);
          },
          (error) => {
            console.warn("User doc listener warning:", error.message);
            setUser((prev) => prev || {
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: currentUser.email === 'nguyenxuantuyensadu@gmail.com' ? 'admin' : 'staff',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
            });
            setAuthLoading(false);
          }
        );
      } else {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      if (unsubUser) {
        unsubUser();
        unsubUser = null;
      }
      unsubscribeAuth();
    };
  }, []);

  // Listen to Firestore data
  useEffect(() => {
    if (!user) return;

    // Listen to Menu
    const unsubscribeMenu = onSnapshot(collection(db, 'menu'), (snapshot) => {
      if (snapshot.empty) {
        if (user.role === 'admin') {
          initialMenu.forEach(item => {
            setDoc(doc(db, 'menu', item.id), sanitizeForFirestore(item)).catch(() => {});
          });
        }
      } else {
        const items = snapshot.docs.map(doc => doc.data() as MenuItem);
        setMenuItems(items);
      }
    }, (error) => {
      console.warn("Firestore menu subscription warning:", error.message);
    });

    // Listen to Orders
    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(items);
    }, (error) => {
      console.warn("Firestore orders subscription warning:", error.message);
    });

    // Listen to Ingredient Expenses (for Monthly Profit calculation)
    const unsubscribeExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IngredientExpense));
      setExpenses(items);
    }, (error) => {
      console.warn("Firestore expenses subscription warning:", error.message);
    });

    // Listen to Payment Settings (QR Code)
    const unsubscribePayment = onSnapshot(doc(db, 'settings', 'payment'), (docSnap) => {
      if (docSnap.exists()) {
        setPaymentSettings(docSnap.data() as PaymentSettings);
      } else if (user.role === 'admin') {
        // Initialize default settings in Firestore
        setDoc(doc(db, 'settings', 'payment'), sanitizeForFirestore(defaultPaymentSettings)).catch(() => {});
      }
    }, (error) => {
      console.warn("Firestore payment settings subscription warning:", error.message);
    });

    // Listen to Preparation Options Settings
    const unsubscribeOptions = onSnapshot(doc(db, 'settings', 'preparation_options'), (docSnap) => {
      if (docSnap.exists()) {
        setOptionsSettings(docSnap.data() as PreparationOptionsSettings);
      } else if (user.role === 'admin') {
        // Initialize default preparation options in Firestore
        setDoc(doc(db, 'settings', 'preparation_options'), sanitizeForFirestore(defaultPreparationOptions)).catch(() => {});
      }
    }, (error) => {
      console.warn("Firestore preparation options subscription warning:", error.message);
    });

    // Listen to Users (for Admin)
    let unsubscribeUsers = () => {};
    if (user.role === 'admin') {
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const items = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AppUser));
        setUsers(items);
        setDataLoading(false);
      }, (error) => {
        console.warn("Firestore users subscription warning:", error.message);
        setDataLoading(false);
      });
    } else {
      setDataLoading(false);
    }

    return () => {
      unsubscribeMenu();
      unsubscribeOrders();
      unsubscribeExpenses();
      unsubscribePayment();
      unsubscribeOptions();
      unsubscribeUsers();
    };
  }, [user]);

  // Workflow Action 1: Gửi order vào bếp
  const handleSendToKitchen = async (cart: CartItem[], total: number, customerName: string, note: string) => {
    if (!user) return;
    const newOrderId = Math.random().toString(36).substr(2, 6);
    const newOrder: Order = {
      id: newOrderId,
      timestamp: Date.now(),
      items: cart,
      total,
      customerName: customerName ? customerName.trim() : 'Khách mang về',
      table: customerName ? customerName.trim() : 'Khách mang về',
      note: note ? note.trim() : '',
      status: 'in_kitchen',
      createdBy: user.uid,
      createdByName: user.displayName || user.email?.split('@')[0] || 'Nhân viên'
    };
    await setDoc(doc(db, 'orders', newOrderId), sanitizeForFirestore(newOrder));
  };

  // Workflow Action 2: Bếp làm xong bấm Ra món
  const handleMarkReady = async (orderId: string) => {
    await setDoc(doc(db, 'orders', orderId), sanitizeForFirestore({
      status: 'ready',
      readyAt: Date.now()
    }), { merge: true });
  };

  // Workflow Action 3: Thu ngân / Phục vụ bấm Tính tiền
  const handleCompletePayment = async (orderId: string, paymentMethod: 'cash' | 'transfer') => {
    await setDoc(doc(db, 'orders', orderId), sanitizeForFirestore({
      status: 'completed',
      paymentMethod,
      completedAt: Date.now()
    }), { merge: true });
  };

  // Workflow Action 4: Huỷ món lẻ khi món đã vào bếp
  const handleCancelItem = async (
    orderId: string, 
    item: CartItem, 
    cancelQty: number = 1, 
    reason: string = ''
  ) => {
    if (!user) return;
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const updatedItems: CartItem[] = [];
    let cancelledName = item.name;

    for (const it of targetOrder.items) {
      const isTarget = (it.cartItemId && item.cartItemId) 
        ? it.cartItemId === item.cartItemId 
        : (it.id === item.id && it.name === item.name && it.options?.size === item.options?.size);

      if (isTarget) {
        cancelledName = it.name;
        if (it.quantity > cancelQty) {
          updatedItems.push({
            ...it,
            quantity: it.quantity - cancelQty
          });
        }
        // If cancelQty >= it.quantity, item is removed from the active ticket
      } else {
        updatedItems.push(it);
      }
    }

    // If no items left, cancel the whole order
    if (updatedItems.length === 0) {
      await handleCancelOrder(orderId, reason || `Huỷ món cuối cùng (${cancelledName})`);
      return;
    }

    // Recalculate total accurately taking into account custom size L price if set
    const newTotal = updatedItems.reduce((sum, it) => {
      const unitPrice = (it.options?.size === 'L' && it.priceL) ? it.priceL : it.price;
      return sum + (unitPrice * it.quantity);
    }, 0);

    const cancelText = `Đã huỷ ${cancelQty}x ${cancelledName}${reason ? ` (${reason})` : ''}`;
    const newNote = targetOrder.note 
      ? (targetOrder.note.includes('Đã huỷ') ? `${targetOrder.note}; ${cancelText}` : `${targetOrder.note} | ${cancelText}`)
      : cancelText;

    await setDoc(doc(db, 'orders', orderId), sanitizeForFirestore({
      items: updatedItems,
      total: newTotal,
      note: newNote,
      lastModifiedAt: Date.now()
    }), { merge: true });
  };

  // Workflow Action 5: Huỷ toàn bộ đơn hàng khi ở bếp hoặc chờ thu tiền
  const handleCancelOrder = async (orderId: string, reason: string = '') => {
    if (!user) return;
    await setDoc(doc(db, 'orders', orderId), sanitizeForFirestore({
      status: 'cancelled',
      cancelledAt: Date.now(),
      cancelledBy: user.uid,
      cancelledByName: user.displayName || user.username || (user.email?.endsWith('@posmini.local') ? user.email.replace('@posmini.local', '') : user.email?.split('@')[0]) || 'Nhân viên',
      cancelReason: reason || 'Khách huỷ món'
    }), { merge: true });
  };

  const handleSaveMenuItem = async (item: MenuItem) => {
    await setDoc(doc(db, 'menu', item.id), sanitizeForFirestore(item));
  };

  const handleDeleteMenuItem = async (id: string) => {
    await deleteDoc(doc(db, 'menu', id));
  };

  const handleUpdateMenu = async (newMenu: MenuItem[]) => {
    const currentIds = new Set(newMenu.map(m => m.id));
    for (const oldItem of menuItems) {
      if (!currentIds.has(oldItem.id)) {
        await deleteDoc(doc(db, 'menu', oldItem.id));
      }
    }
    for (const item of newMenu) {
      await setDoc(doc(db, 'menu', item.id), sanitizeForFirestore(item));
    }
  };

  const handleUpdatePaymentSettings = async (settings: PaymentSettings) => {
    await setDoc(doc(db, 'settings', 'payment'), sanitizeForFirestore(settings));
  };

  const handleUpdateOptionsSettings = async (settings: PreparationOptionsSettings) => {
    await setDoc(doc(db, 'settings', 'preparation_options'), sanitizeForFirestore(settings));
  };

  const handleAddExpense = async (data: Omit<IngredientExpense, 'id' | 'createdAt'>) => {
    const newId = `exp_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
    const newExpense: IngredientExpense = {
      id: newId,
      createdAt: Date.now(),
      ...data
    };
    await setDoc(doc(db, 'expenses', newId), sanitizeForFirestore(newExpense));
  };

  const handleUpdateExpense = async (id: string, data: Partial<IngredientExpense>) => {
    await setDoc(doc(db, 'expenses', id), sanitizeForFirestore(data), { merge: true });
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  const handleClearOrders = async () => {
    for (const order of orders) {
      await setDoc(doc(db, 'orders', order.id), sanitizeForFirestore({ status: 'cancelled' }), { merge: true });
    }
  };

  const handleUpdateUserRole = async (uid: string, role: 'admin' | 'staff') => {
    await setDoc(doc(db, 'users', uid), sanitizeForFirestore({ role }), { merge: true });
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === user?.uid) {
      throw new Error('Không thể xóa tài khoản hiện tại mà bạn đang đăng nhập!');
    }
    await deleteDoc(doc(db, 'users', uid));
  };

  const handleCreateUser = async (username: string, pass: string, role: 'admin' | 'staff', name: string) => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Tên đăng nhập phải có ít nhất 3 ký tự (viết liền không dấu).');
    }

    // Check for duplicate username in current active user list
    const isTaken = users.some(u => 
      (u.username && u.username.toLowerCase() === cleanUsername) ||
      (u.email && u.email.toLowerCase() === `${cleanUsername}@posmini.local`)
    );
    if (isTaken) {
      throw new Error(`Tên đăng nhập "@${cleanUsername}" đã được sử dụng. Vui lòng chọn tên đăng nhập khác.`);
    }

    const authEmail = `${cleanUsername}@posmini.local`;
    const displayName = name.trim() || cleanUsername;
    let newUid = `staff_${cleanUsername}_${Date.now().toString(36)}`;
    let createdInAuth = false;

    try {
      const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, authEmail, pass);
      newUid = userCredential.user.uid;
      
      await updateProfile(userCredential.user, { displayName });
      await secondaryAuth.signOut();
      createdInAuth = true;
    } catch (err: any) {
      console.warn('Firebase Auth user creation note:', err.code, err.message);
      if (err.code === 'auth/email-already-in-use') {
        throw new Error(`Tên đăng nhập "@${cleanUsername}" đã có người sử dụng.`);
      } else if (err.code === 'auth/weak-password') {
        throw new Error('Mật khẩu quá ngắn, vui lòng nhập ít nhất 6 ký tự.');
      }
      // If auth/operation-not-allowed or admin-restricted, we fallback gracefully to saving directly in Firestore users collection
    }

    // Save user record directly to Firestore users collection so staff appears instantly and admin has full control
    await setDoc(doc(db, 'users', newUid), sanitizeForFirestore({
      uid: newUid,
      username: cleanUsername,
      email: authEmail,
      passcode: pass,
      role,
      displayName,
      authMethod: createdInAuth ? 'firebase-auth' : 'local-staff',
      createdAt: new Date().toISOString()
    }));
  };

  const signOut = async () => {
    setUser(null);
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn("Sign out error:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen bg-[#f7f4ee] flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#644127] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const kitchenCount = orders.filter(o => o.status === 'in_kitchen').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="h-screen w-screen bg-[#f7f4ee] flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar for Desktop & Tablet (md:) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-[#e6d5c2] flex-col z-20 shrink-0 h-full">
        {/* Brand */}
        <div className="p-5 lg:p-6 flex items-center gap-3 border-b border-[#f3eae0]">
          <div className="w-11 h-11 bg-gradient-to-br from-[#4f331e] via-[#644127] to-[#8c5b36] rounded-2xl flex items-center justify-center text-white shadow-md shadow-[#4f331e]/20 shrink-0">
            <Coffee size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#25150c] tracking-tight leading-none">POS Mini</h1>
            <p className="text-[11px] font-bold text-[#7c5434] uppercase tracking-wider mt-1">Specialty Coffee & Bar</p>
          </div>
        </div>
        
        {/* User Card */}
        <div className="px-4 py-3">
          <div className="bg-[#faf6f1] p-3 rounded-2xl border border-[#e6d5c2] flex items-center justify-between shadow-2xs">
            <div className="overflow-hidden min-w-0 pr-2">
              <p className="text-sm font-bold text-[#342a22] truncate">
                {user.displayName || user.username || (user.email?.endsWith('@posmini.local') ? user.email.replace('@posmini.local', '') : user.email)}
              </p>
              <p className="text-[11px] font-bold text-[#7c5434] uppercase mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7c5434] inline-block"></span>
                {user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </p>
            </div>
            <button 
              onClick={signOut} 
              className="p-2 text-[#978370] hover:text-red-600 hover:bg-[#f3eae0] rounded-xl transition-colors shrink-0" 
              title="Đăng xuất"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="p-3 lg:p-4 pt-1 space-y-1.5 flex-1 overflow-y-auto">
          {/* Tab 1: Đặt món */}
          <button
            onClick={() => setActiveTab('order')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === 'order' 
                ? 'bg-[#54331e] text-white shadow-md shadow-[#54331e]/25' 
                : 'text-[#5f5043] hover:bg-[#faf6f1] hover:text-[#25150c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Coffee size={20} className={activeTab === 'order' ? 'text-white' : 'text-[#7c5434]'} />
              <span>Gọi món mang về</span>
            </div>
          </button>

          {/* Tab 2: Bếp / Chế biến (KDS) */}
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === 'kitchen' 
                ? 'bg-[#7c5434] text-white shadow-md shadow-[#7c5434]/25' 
                : 'text-[#5f5043] hover:bg-[#faf6f1] hover:text-[#25150c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ChefHat size={20} className={activeTab === 'kitchen' ? 'text-white' : 'text-[#7c5434]'} />
              <span>Bếp / Bar Pha chế</span>
            </div>
            {kitchenCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black shadow-xs ${
                activeTab === 'kitchen' ? 'bg-white text-[#7c5434]' : 'bg-[#7c5434] text-white animate-pulse'
              }`}>
                {kitchenCount}
              </span>
            )}
          </button>

          {/* Tab 3: Phục vụ & Tính tiền */}
          <button
            onClick={() => setActiveTab('serving')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === 'serving' 
                ? 'bg-[#435e38] text-white shadow-md shadow-[#435e38]/20' 
                : 'text-[#5f5043] hover:bg-[#faf6f1] hover:text-[#25150c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className={activeTab === 'serving' ? 'text-white' : 'text-[#7c5434]'} />
              <span>Giao đồ & Thu tiền</span>
            </div>
            {readyCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black shadow-xs ${
                activeTab === 'serving' ? 'bg-white text-[#435e38]' : 'bg-[#435e38] text-white animate-bounce'
              }`}>
                {readyCount}
              </span>
            )}
          </button>

          {/* Tab 4: Lịch sử & Đối soát (Cho cả nhân viên và quản lý) */}
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === 'history' 
                ? 'bg-[#8c5b36] text-white shadow-md shadow-[#8c5b36]/20' 
                : 'text-[#5f5043] hover:bg-[#faf6f1] hover:text-[#25150c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <History size={20} className={activeTab === 'history' ? 'text-white' : 'text-[#7c5434]'} />
              <span>Lịch sử đối soát</span>
            </div>
          </button>
          
          {/* Tab 5: Doanh thu */}
          <button
            onClick={() => setActiveTab('revenue')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === 'revenue' 
                ? 'bg-[#3b2415] text-white shadow-md shadow-[#3b2415]/25' 
                : 'text-[#5f5043] hover:bg-[#faf6f1] hover:text-[#25150c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <DollarSign size={20} className={activeTab === 'revenue' ? 'text-white' : 'text-[#7c5434]'} />
              <span>Doanh thu & Thống kê</span>
            </div>
          </button>

          {/* Tab: Lợi nhuận (Theo tháng) */}
          <button
            onClick={() => setActiveTab('profit')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === 'profit' 
                ? 'bg-[#644127] text-white shadow-md shadow-[#644127]/25' 
                : 'text-[#5f5043] hover:bg-[#faf6f1] hover:text-[#25150c]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Coins size={20} className={activeTab === 'profit' ? 'text-white' : 'text-[#7c5434]'} />
              <span>Lợi nhuận tháng</span>
            </div>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
              activeTab === 'profit' ? 'bg-white text-[#644127]' : 'bg-[#f3eae0] text-[#54331e]'
            }`}>
              Theo tháng
            </span>
          </button>
          
          {/* Tab 6: Quản trị (Admin) */}
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                activeTab === 'admin' 
                  ? 'bg-[#25150c] text-white shadow-md' 
                  : 'text-[#5f5043] hover:bg-[#faf6f1] hover:text-[#25150c]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className={activeTab === 'admin' ? 'text-white' : 'text-[#7c5434]'} />
                <span>Cài đặt Quản trị</span>
              </div>
            </button>
          )}
        </nav>
      </aside>

      {/* Top Header on Mobile (< md) */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#e6d5c2] px-3 py-2 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#4f331e] to-[#7c5434] rounded-xl flex items-center justify-center text-white shadow-xs">
            <Coffee size={17} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-black text-[#25150c] leading-tight">POS Mini</h1>
            <p className="text-[10px] font-bold text-[#7c5434] uppercase tracking-wider">Specialty Bar</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Revenue Shortcut in Mobile Header */}
          <button
            onClick={() => setActiveTab('revenue')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'revenue'
                ? 'bg-[#3b2415] text-white shadow-xs'
                : 'bg-[#faf6f1] text-[#644127] hover:bg-[#f3eae0] border border-[#e6d5c2]'
            }`}
            title="Báo cáo doanh thu"
          >
            <DollarSign size={13} className={activeTab === 'revenue' ? 'text-white' : 'text-[#644127]'} />
            <span className="text-[11px]">Doanh thu</span>
          </button>

          {/* Quick Profit Shortcut in Mobile Header */}
          <button
            onClick={() => setActiveTab('profit')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profit'
                ? 'bg-[#644127] text-white shadow-xs'
                : 'bg-[#faf6f1] text-[#644127] hover:bg-[#f3eae0] border border-[#e6d5c2]'
            }`}
            title="Báo cáo lợi nhuận tháng"
          >
            <Coins size={13} className={activeTab === 'profit' ? 'text-white' : 'text-[#644127]'} />
            <span className="text-[11px]">Lợi nhuận</span>
          </button>

          <span className="text-xs font-bold text-[#342a22] max-w-[90px] truncate hidden sm:inline-block">
            {user.displayName || user.username || (user.email?.endsWith('@posmini.local') ? user.email.replace('@posmini.local', '') : user.email)}
          </span>
          <button 
            onClick={signOut} 
            className="p-1.5 text-[#978370] hover:text-red-600 hover:bg-[#f3eae0] rounded-lg"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col pb-16 md:pb-0">
        {dataLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#644127] border-t-transparent"></div>
          </div>
        ) : (
          <>
            {activeTab === 'order' && (
              <OrderTab 
                menu={menuItems} 
                onSendToKitchen={handleSendToKitchen}
                optionsSettings={optionsSettings}
                userRole={user.role}
                onSaveMenuItem={handleSaveMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
              />
            )}
            {activeTab === 'kitchen' && (
              <KitchenTab 
                orders={orders} 
                onMarkReady={handleMarkReady} 
                onCancelItem={handleCancelItem}
                onCancelOrder={handleCancelOrder}
              />
            )}
            {activeTab === 'serving' && (
              <ServingTab 
                orders={orders} 
                onCompletePayment={handleCompletePayment}
                paymentSettings={paymentSettings}
                onCancelItem={handleCancelItem}
                onCancelOrder={handleCancelOrder}
              />
            )}
            {activeTab === 'history' && (
              <OrderHistoryTab 
                orders={orders} 
                userRole={user.role} 
              />
            )}
            {activeTab === 'revenue' && (
              <RevenueTab 
                orders={orders} 
                onNavigateToProfit={() => setActiveTab('profit')}
              />
            )}
            {activeTab === 'profit' && (
              <ProfitTab 
                orders={orders}
                expenses={expenses}
                currentUser={user}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}
            {activeTab === 'admin' && user.role === 'admin' && (
              <AdminTab 
                menu={menuItems} 
                onUpdateMenu={handleUpdateMenu}
                onSaveMenuItem={handleSaveMenuItem}
                onDeleteMenuItem={handleDeleteMenuItem}
                orders={orders} 
                onClearOrders={handleClearOrders}
                users={users}
                onUpdateUserRole={handleUpdateUserRole}
                onCreateUser={handleCreateUser}
                onDeleteUser={handleDeleteUser}
                currentUserId={user.uid}
                paymentSettings={paymentSettings}
                onUpdatePaymentSettings={handleUpdatePaymentSettings}
                optionsSettings={optionsSettings}
                onUpdateOptionsSettings={handleUpdateOptionsSettings}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-[#e6d5c2] flex items-center justify-around px-1 z-30 shadow-lg shadow-[#25150c]/5">
        {/* Nav 1: Gọi món */}
        <button
          onClick={() => setActiveTab('order')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-w-0 ${
            activeTab === 'order' ? 'text-[#54331e] font-black' : 'text-[#978370] font-medium'
          }`}
        >
          <Coffee size={19} className={activeTab === 'order' ? 'text-[#54331e]' : 'text-[#978370]'} />
          <span className="text-[10px] mt-0.5 truncate max-w-full text-center">Gọi món</span>
        </button>

        {/* Nav 2: Bếp */}
        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors min-w-0 ${
            activeTab === 'kitchen' ? 'text-[#7c5434] font-black' : 'text-[#978370] font-medium'
          }`}
        >
          <div className="relative">
            <ChefHat size={19} className={activeTab === 'kitchen' ? 'text-[#7c5434]' : 'text-[#978370]'} />
            {kitchenCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#7c5434] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {kitchenCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate max-w-full text-center">Bếp</span>
        </button>

        {/* Nav 3: Giao đồ & Tính tiền */}
        <button
          onClick={() => setActiveTab('serving')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors min-w-0 ${
            activeTab === 'serving' ? 'text-[#435e38] font-black' : 'text-[#978370] font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingBag size={19} className={activeTab === 'serving' ? 'text-[#435e38]' : 'text-[#978370]'} />
            {readyCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-[#435e38] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {readyCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate max-w-full text-center">Thu tiền</span>
        </button>

        {/* Nav 4: Lịch sử đối soát đơn hàng */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-w-0 ${
            activeTab === 'history' ? 'text-[#8c5b36] font-black' : 'text-[#978370] font-medium'
          }`}
        >
          <History size={19} className={activeTab === 'history' ? 'text-[#8c5b36]' : 'text-[#978370]'} />
          <span className="text-[10px] mt-0.5 truncate max-w-full text-center">Lịch sử</span>
        </button>

        {/* Nav 5: Doanh thu */}
        <button
          onClick={() => setActiveTab('revenue')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-w-0 ${
            activeTab === 'revenue' ? 'text-[#3b2415] font-black' : 'text-[#978370] font-medium'
          }`}
        >
          <DollarSign size={19} className={activeTab === 'revenue' ? 'text-[#3b2415]' : 'text-[#978370]'} />
          <span className="text-[10px] mt-0.5 truncate max-w-full text-center font-bold">Doanh thu</span>
        </button>

        {/* Nav 6: Lợi nhuận */}
        <button
          onClick={() => setActiveTab('profit')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-w-0 ${
            activeTab === 'profit' ? 'text-[#644127] font-black' : 'text-[#978370] font-medium'
          }`}
        >
          <Coins size={19} className={activeTab === 'profit' ? 'text-[#644127]' : 'text-[#978370]'} />
          <span className="text-[10px] mt-0.5 truncate max-w-full text-center font-bold">Lợi nhuận</span>
        </button>

        {/* Nav 7: Quản trị (Chỉ hiển thị cho Quản trị viên) */}
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-w-0 ${
              activeTab === 'admin' ? 'text-[#25150c] font-black' : 'text-[#978370] font-medium'
            }`}
          >
            <Settings size={19} className={activeTab === 'admin' ? 'text-[#25150c]' : 'text-[#978370]'} />
            <span className="text-[10px] mt-0.5 truncate max-w-full text-center">Quản trị</span>
          </button>
        )}
      </nav>
    </div>
  );
}
