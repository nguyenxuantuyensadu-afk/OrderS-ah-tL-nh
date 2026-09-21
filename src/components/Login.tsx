import { useState, FormEvent } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Store, LogIn, Mail, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed or cancelled popup window intentionally, safely ignore without logging
        return;
      }
      console.error("Google sign in error:", err);
      if (err?.code === 'auth/popup-blocked') {
        setError('Cửa sổ đăng nhập Google bị chặn bởi trình duyệt. Vui lòng cho phép mở popup và thử lại.');
      } else {
        setError(err?.message || 'Đăng nhập Google thất bại');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const rawId = identifier.trim().toLowerCase();
    if (!rawId) {
      setError('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }
    const loginEmail = rawId.includes('@') ? rawId : `${rawId.replace(/[^a-z0-9_.-]/g, '')}@posmini.local`;

    setLoading(true);
    
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, loginEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, loginEmail, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          'Đăng nhập bằng Tên đăng nhập/Mật khẩu chưa được bật trong Firebase Console (lỗi auth/operation-not-allowed). Vui lòng nhấn nút "Đăng nhập bằng Google" ở trên để truy cập ứng dụng ngay lập tức!'
        );
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Tên đăng nhập này đã được sử dụng. Vui lòng chuyển sang đăng nhập.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá ngắn, vui lòng nhập ít nhất 6 ký tự.');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi xử lý tài khoản');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200 mb-3">
            <Store size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">POS Mini</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            Hệ thống Gọi món, Chế biến & Quản lý thu ngân
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p>{error}</p>
              {error.includes('auth/operation-not-allowed') && (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="mt-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Bấm vào đây để Đăng nhập Google</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PRIMARY ACTION: Google Sign-in */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white px-5 py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-md transition-all active:scale-98 disabled:opacity-75 touch-manipulation min-h-[48px]"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>Đăng nhập bằng Google</span>
          </button>
          <p className="text-[11px] text-center text-gray-400 font-medium">
            Đăng nhập 1 chạm an toàn cho Quản trị & Nhân viên
          </p>
        </div>

        {/* Secondary: Username/Password toggle */}
        <div className="relative flex items-center py-2 mb-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <button 
            type="button"
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="flex-shrink-0 mx-3 text-gray-400 hover:text-gray-600 text-xs font-semibold px-2 py-1 rounded-md hover:bg-gray-50 transition-colors"
          >
            {showEmailForm ? 'Ẩn đăng nhập Tên đăng nhập ▲' : 'Hoặc đăng nhập bằng Tên đăng nhập ▼'}
          </button>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {showEmailForm && (
          <form onSubmit={handleEmailAuth} className="space-y-3.5 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Tên đăng nhập hoặc Email</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-gray-400 font-mono font-bold text-sm select-none">@</span>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all font-mono min-h-[44px]"
                  placeholder="Ví dụ: nhanvien1, thungan..."
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all min-h-[44px]"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-95 min-h-[44px]"
            >
              {loading ? 'Đang xử lý...' : (isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập')}
            </button>

            <div className="text-center pt-1">
              <button 
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-amber-600 hover:text-amber-700 text-xs font-semibold"
              >
                {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

