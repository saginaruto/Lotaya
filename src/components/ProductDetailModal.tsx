// components/ProductDetailModal.tsx
'use client';

import { X, MapPin, MessageCircle, Phone } from "lucide-react";
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { getChatRoom, createChatId } from '@/lib/chat';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onChatNow?: (product: any) => void;
  allowChat?: boolean;
}

export default function ProductDetailModal({ 
  isOpen, 
  onClose, 
  product,
  onChatNow,
  allowChat = true
}: ProductDetailModalProps) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'user' | 'seller' | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sellerPhone, setSellerPhone] = useState<string>('');
  const { language } = useLanguage();

  // ✅ ဆိုင်ရှင်ရဲ့ ဖုန်းနံပါတ်ကို ယူမယ်
  useEffect(() => {
    const fetchSellerPhone = async () => {
      if (product?.sellerId) {
        try {
          const sellerRef = doc(db, 'users', product.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            setSellerPhone(sellerData.phone || sellerData.shopPhone || '');
          }
        } catch (error) {
          console.error('Error fetching seller phone:', error);
        }
      }
    };
    fetchSellerPhone();
  }, [product?.sellerId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          setUserRole(snapshot.data().role || 'user');
        } else {
          setUserRole('user');
        }
      } else {
        setUserRole(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleChatNow = async () => {
    console.log("🟢 Chat button clicked!");
    console.log("🔍 currentUser:", currentUser);
    console.log("🔍 product.sellerId:", product?.sellerId);

    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!product?.sellerId) {
      console.error('❌ Product sellerId is missing:', product);
      alert('Product seller information is missing. Please try again.');
      return;
    }

    if (currentUser.uid === product.sellerId) {
      alert('You cannot chat with yourself.');
      return;
    }

    try {
      const chatId = await getChatRoom(
        currentUser.uid,
        product.sellerId,
        product.id
      );
      
      const targetChatId = chatId || createChatId(currentUser.uid, product.sellerId);
      
      console.log("✅ Chat room ID:", targetChatId);
      onClose();
      
      setTimeout(() => {
        router.push(`/chat/${targetChatId}`);
      }, 300);
    } catch (error) {
      console.error('❌ Error finding chat:', error);
      alert('Failed to find chat. Please try again.');
    }
  };

  if (!isOpen || !product) return null;

  const isOwner = currentUser?.uid === product.sellerId;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000000",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        animation: "fadeIn 0.3s ease"
      }}
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          backgroundColor: "rgba(0,0,0,0.7)",
          border: "1px solid #333333",
          color: "#ffffff",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 10
        }}
      >
        <X size={24} />
      </button>

      {/* ====== Product Image with Shop Logo Overlay ====== */}
      <div
        style={{
          width: "100%",
          height: "55vh",
          backgroundColor: "#0a0a0a",
          position: "relative",
          flexShrink: 0,
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={product.image}
          alt={product.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block"
          }}
        />

        {/* ====== Shop Logo - အပေါ်ဆုံးထိ ကပ် ====== */}
        <div
          style={{
            position: "absolute",
            top: "4px",
            left: "12px",
            width: "100px",
            height: "100px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5
          }}
        >
          <img
            src="/logo.png"
            alt="Shop Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: "4px"
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* ====== Bottom Info - ပုံအောက်ခြေကပ်ပြီး ====== */}
      <div
        style={{
          padding: "12px 16px 12px 16px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand, Name, Price - Chat Button နဲ့ တစ်တန်းတည်း */}
        <div>
          {product.discount && product.discount !== 'New' && (
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#ef4444",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 10px",
                borderRadius: "4px",
                marginBottom: "4px"
              }}
            >
              {product.discount}
            </span>
          )}
          
          {/* Product Name နဲ့ Chat Button တစ်တန်းတည်း */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px"
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#F59E0B",
                  margin: "0 0 2px 0"
                }}
              >
                {product.brand}
              </h2>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#ffffff",
                  margin: "0 0 4px 0",
                  lineHeight: 1.3
                }}
              >
                {product.title}
              </h3>
            </div>

            {/* ✅ Chat Button - Product Name နဲ့ တစ်တန်းတည်း */}
            {!loading && allowChat && !isOwner && product.sellerId && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleChatNow();
                }}
                style={{
                  backgroundColor: "#38bdf8",
                  color: "#000000",
                  border: "none",
                  borderRadius: "50px",
                  padding: "8px 16px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  flexShrink: 0,
                  whiteSpace: "nowrap"
                }}
              >
                <MessageCircle size={16} />
                Chat Now
              </button>
            )}
          </div>

          {/* Price */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#22c55e",
              marginTop: "2px"
            }}
          >
            {product.price} MMK
          </div>
        </div>

        {/* Product Details Box */}
        {product?.description && (
          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "8px",
              padding: "10px 14px",
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              marginTop: "6px",
              marginBottom: "8px"
            }}
          >
            <div
              style={{
                color: "#F59E0B",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
              Product Details
            </div>
            <div
              style={{
                color: "#ffffff",
                fontSize: "13px",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {product.description}
            </div>
          </div>
        )}

        {/* ====== Marquee Location + Phone ====== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
            marginTop: "4px",
            overflow: "hidden"
          }}
        >
          <MapPin size={14} style={{ color: "#F59E0B", flexShrink: 0 }} />
          
          {/* ====== Marquee Container ====== */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              position: "relative"
            }}
          >
            <div
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                animation: "marquee 15s linear infinite",
                paddingLeft: "100%"
              }}
            >
              {/* Location - အဖြူရောင် */}
              <span
                style={{
                  fontSize: "12px",
                  color: "#ffffff",
                  fontWeight: "400"
                }}
              >
                {product?.location}
              </span>
            
              {/* Phone Icon + Number - အဝါရောင် */}
              {sellerPhone && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#FCD34D",
                    fontWeight: "500",
                    marginLeft: "16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <Phone size={12} style={{ color: "#22c55e" }} />
                  {sellerPhone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}