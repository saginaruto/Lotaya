// public/firebase-messaging-sw.js

// ၁။ Firebase SDKs ကို import လုပ်
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// ၂။ Firebase Config (ခင်ဗျားရဲ့ config ထည့်ပါ)
const firebaseConfig = {
  apiKey: "AIzaSyDZp2yLittnCqMuynDJE-YZcgWdAxmymwo",
  authDomain: "d-saing-chat.firebaseapp.com",  
  projectId: "d-saing-chat",
  storageBucket: "d-saing-chat.firebasestorage.app",
  messagingSenderId: "533173820233",
  appId: "1:533173820233:web:93361cab4873f791991898",  
};

// ၃။ Firebase ကို Initialize လုပ်
firebase.initializeApp(firebaseConfig);

// ၄။ Messaging ကို ရယူပြီး Background Message Handler သတ်မှတ်
const messaging = firebase.messaging();

// ၅။ Background မှာ Notification လက်ခံရန်
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/logo.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});