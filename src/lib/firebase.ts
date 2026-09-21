import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0777757329",
  appId: "1:987395005216:web:f1c88594d06d9493b41545",
  apiKey: "AIzaSyDlsOFERILkosKZ0yxS6DwvF78JwhhiutE",
  authDomain: "gen-lang-client-0777757329.firebaseapp.com",
  storageBucket: "gen-lang-client-0777757329.firebasestorage.app",
  messagingSenderId: "987395005216",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-posmini-90580be6-fdba-4f26-9026-e30bcc330515");

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

// Secondary app for creating users without signing out the current admin
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

/**
 * Recursively removes any `undefined` properties from an object or array
 * so that Firestore operations (setDoc, updateDoc, addDoc) never throw
 * "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleanObj[key] = sanitizeForFirestore(value);
    }
  }
  return cleanObj as T;
}
