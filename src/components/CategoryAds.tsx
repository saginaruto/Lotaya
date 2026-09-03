'use client';

import { useState, useEffect } from 'react';
import { listenAds, AdItem } from '@/data/Ads';
import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';

interface CategoryAdsProps {
  selectedCategory: string;
  CATEGORY_ADS?: any;
  selectedLocation: string;
  onProductClick?: (product: any, allowChat?: boolean) => void;
  userRole?: 'user' | 'seller' | null;
}

export default function CategoryAds({ 
  selectedCategory,
  CATEGORY_ADS,
  selectedLocation,
  onProductClick,
  userRole
}: CategoryAdsProps) {
  const [mergedAds, setMergedAds] = useState<Record<string, AdItem[]>>({});
  const [loading, setLoading] = useState(true);
  
  // ===== Random ဖြစ်ပြီးသား Category Names နဲ့ Ads တွေကို သိမ်းမယ် =====
  const [randomCategoryNames, setRandomCategoryNames] = useState<string[]>([]);
  const [randomAdsMap, setRandomAdsMap] = useState<Record<string, AdItem[]>>({});
  const [isRandomized, setIsRandomized] = useState(false);

  // ===== Random Shuffle Function =====
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const groupAdsByCategory = (items: AdItem[]): Record<string, AdItem[]> => {
    const grouped: Record<string, AdItem[]> = {};
    items.forEach((item) => {
      const category = item.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  };

  // ===== sessionStorage ကနေ သိမ်းထားတာကိုယူမယ် =====
  const getCachedRandomData = () => {
    try {
      const cached = sessionStorage.getItem('categoryAdsRandom');
      if (cached) {
        const parsed = JSON.parse(cached);
        const now = Date.now();
        if (parsed.timestamp && (now - parsed.timestamp) < 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (e) {
      console.error('Error reading from sessionStorage:', e);
    }
    return null;
  };

  // ===== sessionStorage မှာ သိမ်းမယ် =====
  const saveToSessionStorage = (data: { categoryNames: string[]; adsMap: Record<string, AdItem[]> }) => {
    try {
      sessionStorage.setItem('categoryAdsRandom', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Error saving to sessionStorage:', e);
    }
  };

  // ===== App ဝင်တဲ့အခါ တစ်ခါပဲ Random လုပ်မယ် =====
  useEffect(() => {
    const unsubscribe = listenAds((items: AdItem[]) => {
      const grouped = groupAdsByCategory(items);
      setMergedAds(grouped);
      
      // ✅ sessionStorage ကနေ ရှိမရှိစစ်ပါ
      const cached = getCachedRandomData();
      
      if (cached) {
        // ✅ ရှိရင် သိမ်းထားတာကိုပဲသုံးမယ်
        setRandomCategoryNames(cached.categoryNames);
        setRandomAdsMap(cached.adsMap);
        setIsRandomized(true);
        setLoading(false);
        console.log('🔄 Using cached random data');
        return;
      }
      
      // ✅ မရှိရင် အသစ် Random လုပ်ပြီး သိမ်းမယ်
      if (!isRandomized) {
        // Category Names ကို Random လုပ်ပါ
        const allCategories = Array.from(new Set([
          ...Object.keys(CATEGORY_ADS || {}),
          ...Object.keys(grouped)
        ]));
        
        const shuffledCategories = shuffleArray(allCategories);
        
        // Category တစ်ခုချင်းစီအတွက် Ads တွေကိုလည်း Random လုပ်ပါ
        const shuffledAdsMap: Record<string, AdItem[]> = {};
        shuffledCategories.forEach((cat) => {
          let ads: AdItem[] = [];
          if (grouped[cat] && grouped[cat].length > 0) {
            ads = grouped[cat];
          } else if (CATEGORY_ADS && CATEGORY_ADS[cat]) {
            ads = CATEGORY_ADS[cat];
          }
          shuffledAdsMap[cat] = shuffleArray(ads);
        });
        
        // ✅ State မှာသိမ်းပါ
        setRandomCategoryNames(shuffledCategories);
        setRandomAdsMap(shuffledAdsMap);
        setIsRandomized(true);
        
        // ✅ sessionStorage မှာသိမ်းပါ
        saveToSessionStorage({
          categoryNames: shuffledCategories,
          adsMap: shuffledAdsMap
        });
        
        console.log('🔄 New random data generated and cached');
      }
      
      setLoading(false);
      console.log('🔄 Merged ads updated:', items.length);
    });

    return () => unsubscribe();
  }, []); // ✅ ဒီ useEffect က တစ်ခါပဲ run မယ်

  // ❌ Category သို့ Location ပြောင်းရင် Random ပြန်မလုပ်တော့ဘူး
  // ✅ ဒီ useEffect ကိုဖယ်လိုက်ပါ

  const isRecentProduct = (createdAt: string | undefined): boolean => {
    if (!createdAt) return false;
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return false;
      return (Date.now() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  const handleProductClick = (ad: AdItem) => {
    const allowChat = userRole !== 'seller';
    onProductClick?.(ad, allowChat);
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "16px 16px 40px 16px",
        backgroundColor: "#000000",
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}>
        <div style={{ color: '#888888', fontSize: '14px' }}>Loading products...</div>
      </div>
    );
  }

  // ===== Random ဖြစ်ပြီးသား Category Names နဲ့ Ads တွေကိုသုံးမယ် =====
  const categoryNames = randomCategoryNames.length > 0 ? randomCategoryNames : [];
  const getCategoryAds = (categoryName: string): AdItem[] => {
    return randomAdsMap[categoryName] || [];
  };

  // ===== Category နဲ့ Location ကို စစ်ပြီး သက်ဆိုင်တာပဲပြမယ် =====
  const getFilteredCategoryAds = (categoryName: string): AdItem[] => {
    let ads = getCategoryAds(categoryName);
    
    // ✅ selectedCategory နဲ့ ကိုက်ညီမှုစစ်ပါ
    if (selectedCategory !== "All") {
      ads = ads.filter((ad) => 
        ad.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    // ✅ selectedLocation နဲ့ ကိုက်ညီမှုစစ်ပါ
    if (selectedLocation !== "All") {
      ads = ads.filter((ad) =>
        ad.location?.trim().toLowerCase().includes(selectedLocation.trim().toLowerCase())
      );
    }
    
    return ads;
  };

  return (
    <div style={{ 
      padding: "16px 16px 40px 16px",
      backgroundColor: "#000000",
      flexShrink: 0
    }}>
      {categoryNames.map((categoryName) => {
        const adsList = getFilteredCategoryAds(categoryName);
        if (adsList.length === 0) return null;

        return (
          <section key={categoryName} style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                {categoryName}
              </h2>
              <span style={{ fontSize: "12px", color: "#888888", cursor: "pointer" }}>
                See all
              </span>
            </div>

            <div 
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px"
              }}
            >
              {adsList.map((ad) => {
                const isNew = ad.sellerId && ad.createdAt;
                const isRecent = isNew && isRecentProduct(ad.createdAt);
                
                return (
                  <div
                    key={`${ad.id}-${categoryName}`}
                    style={{
                      backgroundColor: "#121212",
                      border: isRecent ? "2px solid #38bdf8" : "1px solid #262626",
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                      cursor: "pointer",
                      transition: "transform 0.2s, border-color 0.2s",
                      position: "relative"
                    }}
                    onClick={() => handleProductClick(ad)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.borderColor = "#38bdf8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.borderColor = isRecent ? "#38bdf8" : "#262626";
                    }}
                  >
                    {isRecent && (
                      <div
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          backgroundColor: "#38bdf8",
                          color: "#000000",
                          fontSize: "9px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          zIndex: 10
                        }}
                      >
                        NEW
                      </div>
                    )}

                    {/* ====== Product Image ====== */}
                    <div 
                      style={{ 
                        position: "relative", 
                        width: "100%", 
                        height: "200px", 
                        backgroundColor: "#1a1a1a",
                        overflow: "hidden"
                      }}
                    >
                      <img 
                        src={ad.image} 
                        alt={ad.title} 
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&h=800&auto=format&fit=crop';
                        }}
                      />
                      
                      {ad.discount && ad.discount !== 'New' && (
                        <div 
                          style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            backgroundColor: "#ef4444",
                            color: "#ffffff",
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            zIndex: 2
                          }}
                        >
                          {ad.discount}
                        </div>
                      )}

                      {/* ====== Available at - အပေါ်ထောင့် (ညာဘက်) ====== */}
                      {ad.city && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            backgroundColor: "rgba(0,0,0,0.6)",
                            color: "#FCD34D",
                            fontSize: "9px",
                            fontWeight: "600",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            zIndex: 2,
                          }}
                        >
                          Available at {ad.city}
                        </div>
                      )}

                      {/* ====== Overlay Text - ဘယ်ဘက်အောက်ထောင့် ====== */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "8px 10px",
                          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 70%, transparent 100%)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          gap: "2px",
                          zIndex: 2
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#ffffff",
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textShadow: "0 1px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          {ad.title}
                        </h3>

                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "#4ADE80",
                            textShadow: "0 1px 4px rgba(0,0,0,0.8)"
                          }}
                        >
                          {ad.price} MMK
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}