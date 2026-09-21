import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, sanitizeForFirestore } from './lib/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { AppUser, MenuItem, Order, CartItem, PaymentSettings, PreparationOptionsSettings } from './types';
import { initialMenu, defaultPaymentSettings, defaultPreparationOptions } from './data';
import Login from './components/Login';
import OrderTab from './components/OrderTab';
import KitchenTab from './components/KitchenTab';
import ServingTab from './components/ServingTab';
import RevenueTab from './components/RevenueTab';
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
  History
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'order' | 'kitchen' | 'serving' | 'history' | 'revenue' | 'admin'>('order');
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [optionsSettings, setOptionsSettings] = useState<PreparationOptionsSettings>(defaultPreparationOptions);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Security guard: If non-admin tries to access revenue or admin, redirect to order
  useEffect(() => {
    if (user && user.role !== 'admin' && (activeTab === 'revenue' || activeTab === 'admin')) {
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
              setUser({
                uid: currentUser.uid,
                email: currentUser.email || '',
                username,
                role: data.role || 'staff',
                displayName: currentUser.displayName || data.displayName || username || currentUser.email?.split('@')[0]
              });
            } else {
              const username = currentUser.email?.endsWith('@posmini.local') ? currentUser.email.replace('@posmini.local', '') : undefined;
              const isOwnerAdmin = currentUser.email === 'nguyenxuantuyensadu@gmail.com';
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
      <div className="h-screen bg-gray-100 flex items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const kitchenCount = orders.filter(o => o.status === 'in_kitchen').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* Sidebar for Desktop & Tablet (md:) */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-white border-r border-gray-200 flex-col z-20 shrink-0 h-full">
        {/* Brand */}
        <div className="p-5 lg:p-6 flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-amber-200 shrink-0">
            <Store size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight leading-none">POS Mini</h1>
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mt-1">Takeaway & Pha chế</p>
          </div>
        </div>
        
        {/* User Card */}
        <div className="px-5 pb-3">
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div className="overflow-hidden min-w-0 pr-2">
              <p className="text-sm font-bold text-gray-800 truncate">
                {user.displayName || user.username || (user.email?.endsWith('@posmini.local') ? user.email.replace('@posmini.local', '') : user.email)}
              </p>
              <p className="text-[11px] font-bold text-amber-600 uppercase mt-0.5">
                {user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </p>
            </div>
            <button 
              onClick={signOut} 
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0" 
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
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Coffee size={20} className={activeTab === 'order' ? 'text-white' : 'text-gray-400'} />
              <span>Gọi món mang về</span>
            </div>
          </button>

          {/* Tab 2: Bếp / Chế biến (KDS) */}
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
              activeTab === 'kitchen' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ChefHat size={20} className={activeTab === 'kitchen' ? 'text-white' : 'text-gray-400'} />
              <span>Bếp / Bar</span>
            </div>
            {kitchenCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black shadow-xs ${
                activeTab === 'kitchen' ? 'bg-white text-orange-600' : 'bg-orange-500 text-white animate-pulse'
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
                ? 'bg-green-600 text-white shadow-md shadow-green-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag size={20} className={activeTab === 'serving' ? 'text-white' : 'text-gray-400'} />
              <span>Giao đồ & Thu tiền</span>
            </div>
            {readyCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black shadow-xs ${
                activeTab === 'serving' ? 'bg-white text-green-700' : 'bg-green-600 text-white animate-bounce'
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
                ? 'bg-amber-600 text-white shadow-md shadow-amber-200' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <History size={20} className={activeTab === 'history' ? 'text-white' : 'text-gray-400'} />
              <span>Lịch sử đối soát</span>
            </div>
          </button>
          
          {/* Tab 5: Doanh thu (Chỉ Quản trị viên mới xem được) */}
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('revenue')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                activeTab === 'revenue' 
                  ? 'bg-gray-900 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <DollarSign size={20} className={activeTab === 'revenue' ? 'text-white' : 'text-gray-400'} />
                <span>Doanh thu</span>
              </div>
            </button>
          )}
          
          {/* Tab 6: Quản trị (Admin) */}
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                activeTab === 'admin' 
                  ? 'bg-gray-800 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings size={20} className={activeTab === 'admin' ? 'text-white' : 'text-gray-400'} />
                <span>Quản trị</span>
              </div>
            </button>
          )}
        </nav>
      </aside>

      {/* Top Header on Mobile (< md) */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Store size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-800 leading-tight">POS Mini</h1>
            <p className="text-[10px] font-bold text-amber-600 uppercase">Takeaway</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 max-w-[120px] truncate">
            {user.displayName || user.username || (user.email?.endsWith('@posmini.local') ? user.email.replace('@posmini.local', '') : user.email)}
          </span>
          <button 
            onClick={signOut} 
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
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
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
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
              <KitchenTab orders={orders} onMarkReady={handleMarkReady} />
            )}
            {activeTab === 'serving' && (
              <ServingTab 
                orders={orders} 
                onCompletePayment={handleCompletePayment}
                paymentSettings={paymentSettings}
              />
            )}
            {activeTab === 'history' && (
              <OrderHistoryTab 
                orders={orders} 
                userRole={user.role} 
              />
            )}
            {activeTab === 'revenue' && user.role === 'admin' && (
              <RevenueTab orders={orders} />
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center justify-around px-1 z-30 shadow-lg">
        {/* Nav 1: Gọi món */}
        <button
          onClick={() => setActiveTab('order')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'order' ? 'text-amber-600 font-black' : 'text-gray-500 font-medium'
          }`}
        >
          <Coffee size={20} className={activeTab === 'order' ? 'text-amber-600' : 'text-gray-400'} />
          <span className="text-[10px] mt-1">Gọi món</span>
        </button>

        {/* Nav 2: Bếp */}
        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
            activeTab === 'kitchen' ? 'text-orange-600 font-black' : 'text-gray-500 font-medium'
          }`}
        >
          <div className="relative">
            <ChefHat size={20} className={activeTab === 'kitchen' ? 'text-orange-600' : 'text-gray-400'} />
            {kitchenCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-orange-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {kitchenCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Bếp</span>
        </button>

        {/* Nav 3: Giao đồ & Tính tiền */}
        <button
          onClick={() => setActiveTab('serving')}
          className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-colors ${
            activeTab === 'serving' ? 'text-green-600 font-black' : 'text-gray-500 font-medium'
          }`}
        >
          <div className="relative">
            <ShoppingBag size={20} className={activeTab === 'serving' ? 'text-green-600' : 'text-gray-400'} />
            {readyCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-green-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {readyCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Thu tiền</span>
        </button>

        {/* Nav 4: Lịch sử đối soát đơn hàng (Cho nhân viên & quản trị viên) */}
        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'history' ? 'text-amber-600 font-black' : 'text-gray-500 font-medium'
          }`}
        >
          <History size={20} className={activeTab === 'history' ? 'text-amber-600' : 'text-gray-400'} />
          <span className="text-[10px] mt-1">Lịch sử</span>
        </button>

        {/* Nav 5: Quản trị (Chỉ hiển thị cho Quản trị viên) */}
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              activeTab === 'admin' ? 'text-gray-900 font-black' : 'text-gray-500 font-medium'
            }`}
          >
            <Settings size={20} className={activeTab === 'admin' ? 'text-gray-900' : 'text-gray-400'} />
            <span className="text-[10px] mt-1">Quản trị</span>
          </button>
        )}
      </nav>
    </div>
  );
}
