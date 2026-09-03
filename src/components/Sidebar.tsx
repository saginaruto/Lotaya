'use client';

import { useState, useEffect } from 'react';
import { X, User, ShoppingBag, Settings, HelpCircle, LogOut, UserPlus, LogIn, Camera, MessageCircle, Store, ShoppingCart } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  user?: any;
  userRole?: 'user' | 'seller' | null;
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, user, userRole }: SidebarProps) {
  const router = useRouter();
  const [username, setUsername] = useState<string>('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('en');
  const [currentRole, setCurrentRole] = useState<'user' | 'seller' | null>(userRole || null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUsername(data.username || data.displayName || user.email?.split('@')[0] || 'User');
          setPhotoURL(data.photoURL || null);
          setLanguage(data.language || 'en');
          setCurrentRole(data.role || userRole || 'user');
        }
      }
    };
    fetchUserData();
  }, [user, userRole]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ✅ Add Buyer Account (သီးသန့်အကောင့်)
  const handleAddBuyerAccount = () => {
    setIsSidebarOpen(false);
    router.push('/signup?role=buyer');
  };

  // ✅ Add Seller Account (သီးသန့်အကောင့်)
  const handleAddSellerAccount = () => {
    setIsSidebarOpen(false);
    router.push('/signup?role=seller');
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      my: {
        'sidebar.seller': 'ရောင်းချသူ',
        'sidebar.buyer': 'ဝယ်ယူသူ',
        'sidebar.guest': 'ဧည့်သည်',
        'sidebar.profile': 'ပရိုဖိုင်',
        'sidebar.dashboard': 'ဒက်ရှ်ဘုတ်',
        'sidebar.welcome': 'D Saing မှ ကြိုဆိုပါသည်',
        'sidebar.login': 'ဝင်မည်',
        'sidebar.signup': 'အကောင့်ဖွင့်မည်',
        'sidebar.settings': 'ဆက်တင်များ',
        'sidebar.help': 'အကူအညီ',
        'sidebar.logout': 'ထွက်မည်',
        'Chat': 'စကားပြောခန်း',
        'sidebar.addBuyer': 'ဝယ်ယူသူအကောင့်ဖွင့်မည်',
        'sidebar.addSeller': 'ရောင်းချသူအကောင့်ဖွင့်မည်',
        'sidebar.sellNow': 'ရောင်းမည်',
      },
      en: {
        'sidebar.seller': 'Seller',
        'sidebar.buyer': 'Buyer',
        'sidebar.guest': 'Guest',
        'sidebar.profile': 'Profile',
        'sidebar.dashboard': 'Dashboard',
        'sidebar.welcome': 'Welcome to D Saing',
        'sidebar.login': 'Login',
        'sidebar.signup': 'Sign Up',
        'sidebar.settings': 'Settings',
        'sidebar.help': 'Help & Support',
        'sidebar.logout': 'Log Out',
        'Chat': 'Chat',
        'sidebar.addBuyer': 'Create Buyer Account',
        'sidebar.addSeller': 'Create Seller Account',
        'sidebar.sellNow': 'Sell Now',
      }
    };
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const getRoleLabel = () => {
    if (currentRole === 'seller') return '🛒 ' + t('sidebar.seller');
    if (currentRole === 'user') return '👤 ' + t('sidebar.buyer');
    return t('sidebar.guest');
  };

  const getRoleColor = () => {
    if (currentRole === 'seller') return '#FFD700';
    if (currentRole === 'user') return '#38bdf8';
    return '#888888';
  };

  return (
    <>
      <div 
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 50,
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? "auto" : "none",
          transition: "opacity 0.3s ease"
        }}
      />

      <aside 
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          maxWidth: "80vw",
          backgroundColor: "#0a0a0a",
          borderRight: "1px solid #1a1a1a",
          zIndex: 51,
          transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "20px 16px",
          boxSizing: "border-box",
          overflowY: "auto"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Close Button */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              style={{
                backgroundColor: "#121212",
                border: "1px solid #262626",
                color: "#ffffff",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >          
              <X size={16} />
            </button>
          </div>

          {/* User Section */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#121212",
              borderRadius: "12px",
              border: "1px solid #1a1a1a"
            }}
          >
            {user ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setIsSidebarOpen(false)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    padding: '8px',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      backgroundColor: "#1e1e1e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "24px",
                      fontWeight: "700",
                      position: "relative",
                      border: `2px solid ${getRoleColor()}`,
                      overflow: "hidden"
                    }}
                  >
                    {photoURL ? (
                      <img 
                        src={photoURL} 
                        alt={username || 'User'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      username?.charAt(0).toUpperCase() || 'U'
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        right: "-2px",
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #262626",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888888",
                        fontSize: "10px"
                      }}
                    >
                      <Camera size={10} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: "#ffffff", fontSize: "15px", fontWeight: "600" }}>
                      {username}
                    </div>
                    <div style={{ 
                      color: getRoleColor(), 
                      fontSize: "12px", 
                      fontWeight: "500",
                      marginTop: "2px"
                    }}>
                      {getRoleLabel()}
                    </div>
                  </div>
                </Link>

                {/* ✅ Add Account Buttons - သီးသန့်အကောင့်ဖွင့်ဖို့ */}
                {currentRole === 'seller' && (
                  <button
                    onClick={handleAddBuyerAccount}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #38bdf8",
                      borderRadius: "8px",
                      color: "#38bdf8",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#38bdf8";
                      e.currentTarget.style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1a1a1a";
                      e.currentTarget.style.color = "#38bdf8";
                    }}
                  >
                    <ShoppingCart size={16} />
                    {t('sidebar.addBuyer')}
                  </button>
                )}

                {currentRole === 'user' && (
                  <button
                    onClick={handleAddSellerAccount}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      padding: "10px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #FFD700",
                      borderRadius: "8px",
                      color: "#FFD700",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.3s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFD700";
                      e.currentTarget.style.color = "#000000";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#1a1a1a";
                      e.currentTarget.style.color = "#FFD700";
                    }}
                  >
                    <Store size={16} />
                    {t('sidebar.addSeller')}
                  </button>
                )}

                {/* Navigation Links */}
                <div style={{ 
                  marginTop: "12px", 
                  display: "flex", 
                  flexDirection: "column",
                  gap: "8px",
                  borderTop: "1px solid #1a1a1a",
                  paddingTop: "12px"
                }}>
                  <Link
                    href="/profile"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontSize: "13px",
                      transition: "background 0.2s"
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>👤</span>
                    <span>{t('sidebar.profile')}</span>
                  </Link>
                  
                  {(currentRole === 'seller') && (
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setIsSidebarOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "8px 12px",
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #262626",
                        borderRadius: "8px",
                        color: "#ffffff",
                        textDecoration: "none",
                        fontSize: "13px",
                        transition: "background 0.2s"
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>📊</span>
                      <span>{t('sidebar.dashboard')}</span>
                    </Link>
                  )}

                  <Link
                    href="/chat"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 12px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontSize: "13px",
                      transition: "background 0.2s"
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>💬</span>
                    <span>{t('Chat')}</span>
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <div style={{ color: "#888888", fontSize: "13px", marginBottom: "8px", textAlign: "center" }}>
                  {t('sidebar.welcome')}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link
                    href="/login"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      border: "1px solid #262626",
                      borderRadius: "6px",
                      padding: "8px",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontSize: "13px",
                      textAlign: "center",
                      fontWeight: "500"
                    }}
                  >
                    <LogIn size={14} style={{ display: "inline", marginRight: "4px" }} />
                    {t('sidebar.login')}
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{
                      flex: 1,
                      backgroundColor: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px",
                      color: "#000000",
                      textDecoration: "none",
                      fontSize: "13px",
                      textAlign: "center",
                      fontWeight: "500"
                    }}
                  >
                    <UserPlus size={14} style={{ display: "inline", marginRight: "4px" }} />
                    {t('sidebar.signup')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <Link
              href={currentRole === 'seller' ? '/seller/settings' : '/settings'}
              onClick={() => setIsSidebarOpen(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                backgroundColor: "transparent",
                borderRadius: "8px",
                color: "#e3e3e3",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                textDecoration: "none",
                width: "auto"
              }}
            >
              <Settings size={18} />
              <span>{t('sidebar.settings')}</span>
            </Link>
            
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                backgroundColor: "transparent",
                border: "none",
                borderRadius: "8px",
                color: "#e3e3e3",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                width: "auto"
              }}
            >
              <HelpCircle size={18} />
              <span>{t('sidebar.help')}</span>
            </button>
          </nav>
        </div>

        {user && (
          <div>
            <button 
              onClick={handleLogout}
              style={{ 
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                backgroundColor: "#121212",
                border: "none",
                borderRadius: "10px",
                color: "#ef4444",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                width: "auto"
              }}
            >
              <LogOut size={18} />
              <span>{t('sidebar.logout')}</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}