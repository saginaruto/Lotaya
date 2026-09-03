// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import * as messagingModule from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDZp2yLittnCqMuynDJE-YZcgWdAxmymwo",
  authDomain: "d-saing-chat.firebaseapp.com",
  databaseURL: "https://d-saing-chat-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "d-saing-chat",
  storageBucket: "d-saing-chat.firebasestorage.app",
  messagingSenderId: "533173820233",
  appId: "1:533173820233:web:93361cab4873f791991898",
  measurementId: "G-W63WPRF433"
};

// App ကို initialize လုပ်
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore instance ကို ရယူ
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ✅ requestFCMToken ကို export လုပ်ပါ
let messagingInstance: any = null;

export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') return null;
  if (!messagingInstance) {
    const supported = await messagingModule.isSupported();
    if (supported) {
      messagingInstance = messagingModule.getMessaging(app);
    }
  }
  return messagingInstance;
};

export const requestFCMToken = async (userId: string) => {
  if (typeof window === 'undefined') return null;

  if (Notification.permission === 'denied') {
    console.warn('⚠️ Notification permission is blocked');
    return null;
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted');
      return null;
    }
  }

  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ FCM Service Worker registered');
      } catch (swError) {
        console.warn('⚠️ FCM Service Worker registration failed:', swError);
      }
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
    const token = await (messagingModule as any).getToken(messaging, { vapidKey });

    if (token) {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, { fcmToken: token }, { merge: true });
      console.log('✅ FCM Token saved:', token);
      return token;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
};

export const listenForMessages = async (callback: (payload: any) => void) => {
  if (typeof window === 'undefined') return;
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return;
    messagingModule.onMessage(messaging, (payload) => {
      console.log('📱 Message received:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error listening for messages:', error);
  }
};

// Export functions
export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  limit,
};

export type {
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
};