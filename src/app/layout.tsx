// app/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { auth, requestFCMToken, listenForMessages } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import './globals.css';
import LanguageProvider, { Language } from '@/components/LanguageProvider';
import ToastNotification from '@/components/ToastNotification';
import { SessionProvider } from '@/context/SessionContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { WishlistProvider } from '@/context/WishlistContext'; // ✅ ထည့်ပါ

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ title: string; body: string; senderName?: string } | null>(null);

  // ✅ Theme ကို LocalStorage ကနေ ဖတ်ပြီး apply လုပ်မယ်
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', defaultTheme);
      localStorage.setItem('theme', defaultTheme);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLanguage('en');

          try {
            await requestFCMToken(user.uid);
            
            listenForMessages((payload) => {
              console.log('📨 Foreground message:', payload);
              
              const title = payload.notification?.title || payload.data?.title || 'မက်ဆေ့ခ်ျအသစ်';
              const body = payload.notification?.body || payload.data?.body || 'မှာယူမှုအသစ် ရောက်ရှိပါပြီ';
              const senderName = payload.data?.senderName || '';
              
              if (payload.notification) {
                new Notification(payload.notification.title || 'New Message', {
                  body: payload.notification.body || '',
                  icon: '/logo.png'
                });
              }
              
              setToast({
                title: title,
                body: body,
                senderName: senderName,
              });
            });
            
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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((reg) => console.log('✅ FCM/PWA Service Worker registered:', reg))
        .catch((err) => console.log('❌ Service Worker registration failed:', err));
    }
  }, []);

  const headElements = (
    <>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#000000" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="D Saing" />
      <meta name="mobile-web-app-capable" content="yes" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <link rel="icon" href="/icons/icon-192x192.png" />
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
        <ThemeProvider>
          <SessionProvider>
            <WishlistProvider>  {/* ✅ WishlistProvider ထည့်ပါ */}
              <LanguageProvider initialLanguage={language}>
                {children}
                {toast && (
                  <ToastNotification
                    message={toast.body}
                    senderName={toast.senderName || toast.title}
                    onClose={() => setToast(null)}
                    duration={5000}
                  />
                )}
              </LanguageProvider>
            </WishlistProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}