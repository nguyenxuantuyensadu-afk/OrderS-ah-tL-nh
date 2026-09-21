import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, sanitizeForFirestore } from './firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user role from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let role: 'admin' | 'staff' = 'staff';
          let displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            role = data.role || 'staff';
            if (data.displayName) {
              displayName = data.displayName;
            }
          } else {
            // Check if root admin
            const isFirstUser = firebaseUser.email === 'nguyenxuantuyensadu@gmail.com';
            role = isFirstUser ? 'admin' : 'staff';
            await setDoc(userDocRef, sanitizeForFirestore({
              email: firebaseUser.email || '',
              role: role,
              displayName: displayName || 'User',
            }));
          }
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role,
            displayName,
          });
        } catch (error) {
          console.error("Error fetching or initializing user profile:", error);
          // Graceful fallback so user isn't locked out of the app
          const isFirstUser = firebaseUser.email === 'nguyenxuantuyensadu@gmail.com';
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: isFirstUser ? 'admin' : 'staff',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
