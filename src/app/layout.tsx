// app/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, requestFCMToken } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './globals.css';
import LanguageProvider, { Language } from '@/components/LanguageProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLanguage('en');

          // ✅ FCM Token ရယူရန် - Service Worker ကို ဦးစွာ Register လုပ်
          try {
            // Service Worker ကို အရင်ဆုံး Register လုပ်ပါ
            if ('serviceWorker' in navigator) {
              // ✅ firebase-messaging-sw.js ကို ဦးစွာ Register လုပ်
              await navigator.serviceWorker.register('/firebase-messaging-sw.js');
              console.log('✅ Firebase Messaging SW registered');
            }
            
            // ပြီးမှ FCM Token ရယူပါ
            await requestFCMToken(user.uid);
          } catch (error) {
            console.warn('FCM token request failed:', error);
          }
        } catch (error) {
          console.error('Error initializing notifications:', error);
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Service Worker (PWA) အတွက်
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('✅ PWA Service Worker registered:', reg))
        .catch((err) => console.log('❌ PWA Service Worker registration failed:', err));
    }
  }, []);

  // ✅ Head elements ကို တစ်နေရာတည်းမှာ စုပါ
  const headElements = (
    <>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="D Saing" />
      <meta name="mobile-web-app-capable" content="yes" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <link rel="icon" href="/icons/icon-192.png" />
      
      {/* ✅ Firebase Messaging Service Worker အတွက် Scope သတ်မှတ် */}
      <link rel="service-worker" href="/firebase-messaging-sw.js" />
    </>
  );

  if (isLoading) {
    return (
      <html lang="en">
        <head>{headElements}</head>
        <body>
          <div style={{
            minHeight: '100vh',
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            Loading...
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>{headElements}</head>
      <body>
        <LanguageProvider initialLanguage={language}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}