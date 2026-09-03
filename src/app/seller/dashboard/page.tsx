'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, PlusCircle, Search, ClipboardList, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface Product {
  id: string;
  title?: string;
  price?: string;
  image?: string;
  category?: string;
  brand?: string;
  createdAt?: any;
  sellerId?: string;
  sellerName?: string;
  description?: string;
  discount?: string;
  location?: string;
  cta?: string;
  stock?: number;
}

interface SaleOrder {
  totalAmount?: number;
  status?: string;
  createdAt?: any;
}

export default function SellerDashboard() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSalesCalendarOpen, setIsSalesCalendarOpen] = useState(false);
  const [selectedSalesMonth, setSelectedSalesMonth] = useState(() => new Date().getMonth());
  const [selectedSalesYear, setSelectedSalesYear] = useState(() => new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);

  // Helper function for createdAt
  const getCreatedAtTime = (createdAt: any): number => {
    if (!createdAt) return 0;
    
    if (typeof createdAt === 'object' && createdAt.toDate && typeof createdAt.toDate === 'function') {
      return createdAt.toDate().getTime();
    }
    
    if (typeof createdAt === 'string') {
      const parsed = new Date(createdAt);
      return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
    }
    
    if (typeof createdAt === 'number') {
      return createdAt;
    }
    
    return 0;
  };

  // Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          const userRef = doc(db, 'users', user.uid);
          const snapshot = await getDoc(userRef);
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);
            if (!['seller', 'VENDOR'].includes(data.role)) {
              router.push('/');
            }
          } else {
            router.push('/profile');
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('Failed to authenticate');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // Real-time listener for products
  useEffect(() => {
    if (!user) return;

    setError(null);
    
    const q = query(
      collection(db, 'products'),
      where('sellerId', '==', user.uid)
    );

    const unsubscribeProducts = onSnapshot(q, 
      (snapshot) => {
        try {
          const productList: Product[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data() as Omit<Product, 'id'>
          }));
          
          const sortedProducts = productList.sort((a, b) => {
            const timeA = getCreatedAtTime(a.createdAt);
            const timeB = getCreatedAtTime(b.createdAt);
            return timeB - timeA;
          });
          
          setProducts(sortedProducts);
          setFilteredProducts(sortedProducts);
          console.log('✅ Products loaded:', sortedProducts.length);
        } catch (err) {
          console.error('Error processing products:', err);
          setError('Failed to load products');
        }
      },
      (error) => {
        console.error('❌ Firestore error:', error);
        setError(`Failed to load products: ${error.message}`);
      }
    );

    return () => unsubscribeProducts();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const salesQuery = query(
      collection(db, 'orders'),
      where('sellerId', '==', user.uid)
    );

    return onSnapshot(salesQuery, (snapshot) => {
      const confirmedSales = snapshot.docs
        .map((saleSnapshot) => saleSnapshot.data() as SaleOrder)
        .filter((sale) => sale.status === 'CONFIRMED' || sale.status === 'DELIVERED');
      setSales(confirmedSales);
    }, (salesError) => {
      console.error('Failed to load dashboard sales:', salesError);
    });
  }, [user]);

  // Search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#ffffff',
        gap: '16px'
      }}>
        <div>{t('common.loading')}</div>
        <div style={{ color: '#888888', fontSize: '14px' }}>
          {t('common.pleaseWait')}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#ffffff',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{ color: '#ef4444', fontSize: '20px' }}>⚠️ {t('common.error')}</div>
        <div style={{ color: '#888888', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            backgroundColor: '#38bdf8',
            color: '#000000',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!user || !userData || !['seller', 'VENDOR'].includes(userData.role)) {
    return null;
  }

  // Calculate low stock products (stock < 10)
  const lowStockCount = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
  const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;

  const monthlySales = sales.reduce<Record<string, { label: string; total: number }>>((months, sale) => {
    const saleTime = getCreatedAtTime(sale.createdAt);
    if (!saleTime) return months;
    const date = new Date(saleTime);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    months[monthKey] = {
      label: monthLabel,
      total: (months[monthKey]?.total || 0) + Number(sale.totalAmount || 0),
    };
    return months;
  }, {});
  const currentYear = new Date().getFullYear();
  const shopStartDate = new Date(getCreatedAtTime(userData.createdAt));
  const shopStartYear = Number.isNaN(shopStartDate.getTime()) ? currentYear : shopStartDate.getFullYear();
  const lastSelectableYear = currentYear + 10;
  const availableYears = Array.from({ length: Math.max(1, lastSelectableYear - shopStartYear + 1) }, (_, index) => lastSelectableYear - index);
  const monthNames = Array.from({ length: 12 }, (_, month) => new Date(selectedSalesYear, month, 1).toLocaleDateString(undefined, { month: 'long' }));
  const selectedMonthKey = `${selectedSalesYear}-${String(selectedSalesMonth + 1).padStart(2, '0')}`;
  const selectedMonthSummary = monthlySales[selectedMonthKey];
  const selectedMonthOrders = sales.filter((sale) => {
    const saleDate = new Date(getCreatedAtTime(sale.createdAt));
    return saleDate.getFullYear() === selectedSalesYear && saleDate.getMonth() === selectedSalesMonth;
  }).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={20} />
            {t('common.backToHome')}
          </Link>
          <h1 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '700', margin: 0 }}>
            📊 {t('dashboard.title')}
          </h1>
        </div>

        {/* Welcome */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h2 style={{ color: '#ffffff', fontSize: '18px', margin: 0 }}>
            {t('dashboard.welcomeBack')}, <span style={{ color: '#FFD700' }}>{userData.username || 'Seller'}</span>
          </h2>
          <p style={{ color: '#888888', fontSize: '14px', marginTop: '4px' }}>
            {t('dashboard.youHave')} <strong style={{ color: '#38bdf8' }}>{products.length}</strong> {t('dashboard.productsInShop')}
          </p>
          {/* Stock Status Summary */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
            {outOfStockCount > 0 && (
              <span style={{ 
                color: '#ef4444', 
                fontSize: '13px', 
                fontWeight: '500' 
              }}>
                ⚠️ {outOfStockCount} {t('dashboard.outOfStock')}
              </span>
            )}
            {lowStockCount > 0 && (
              <span style={{ 
                color: '#f59e0b', 
                fontSize: '13px', 
                fontWeight: '500' 
              }}>
                ⚠️ {lowStockCount} {t('dashboard.lowStock')}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div
            style={{
              backgroundColor: '#121212',
              border: '1px solid #262626',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Package size={20} />
            </div>
            <div>
              <div style={{ color: '#888888', fontSize: '12px' }}>{t('dashboard.totalProducts')}</div>
              <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700' }}>{products.length}</div>
            </div>
          </div>
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isSalesCalendarOpen}
            aria-label="Open monthly sales calendar"
            onClick={() => setIsSalesCalendarOpen((isOpen) => !isOpen)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') setIsSalesCalendarOpen((isOpen) => !isOpen);
            }}
            style={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '12px', padding: '16px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <BarChart3 size={20} color="#22c55e" />
              <strong style={{ color: '#ffffff', fontSize: '14px' }}>{t('dashboard.monthlySalesSummary')}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#d4d4d8', fontSize: '12px' }}>
              <span>{monthNames[selectedSalesMonth]}</span>
              <strong style={{ color: '#38bdf8', whiteSpace: 'nowrap' }}>{(selectedMonthSummary?.total || 0).toLocaleString()} MMK</strong>
            </div>
            <div style={{ color: '#888888', fontSize: '12px', marginTop: '5px' }}>{selectedMonthOrders} completed order{selectedMonthOrders === 1 ? '' : 's'}</div>
            {isSalesCalendarOpen && (
              <div onClick={(event) => event.stopPropagation()} style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #27272a' }}>
                <div style={{ color: '#fff', fontSize: '20px', fontWeight: 700, textAlign: 'center', marginBottom: '10px' }}>{selectedSalesYear}</div>
                <div style={{ color: '#a1a1aa', fontSize: '11px', textAlign: 'center', marginBottom: '6px' }}>{t('dashboard.selectYear')}</div>
                <div style={{ display: 'grid', gap: '6px', maxHeight: '96px', overflowY: 'auto', overscrollBehavior: 'contain', padding: '2px 4px 8px 2px', marginBottom: '12px' }}>
                  {availableYears.map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedSalesYear(year)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: year === selectedSalesYear ? '1px solid #38bdf8' : '1px solid #3f3f46', backgroundColor: year === selectedSalesYear ? '#0c4a6e' : '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '12px', textAlign: 'left' }}
                    >
                      {year}
                    </button>
                  ))}
                </div>
                <div style={{ color: '#a1a1aa', fontSize: '11px', marginBottom: '7px' }}>{t('dashboard.selectMonth')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px' }}>
                  {monthNames.map((month, index) => (
                    <button
                      key={month}
                      onClick={() => setSelectedSalesMonth(index)}
                      style={{ width: '100%', minWidth: 0, padding: '9px 4px', borderRadius: '6px', border: index === selectedSalesMonth ? '1px solid #38bdf8' : '1px solid #3f3f46', backgroundColor: index === selectedSalesMonth ? '#0c4a6e' : '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '11px', textAlign: 'center' }}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <Link
            href="/seller/products/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              color: '#000000',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            <PlusCircle size={18} />
            {t('dashboard.addNewProduct')}
          </Link>
          
          <Link
            href="/seller/products"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
              color: '#ffffff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'border-color 0.2s, background 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#38bdf8';
              e.currentTarget.style.backgroundColor = '#262626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#262626';
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }}
          >
            <Package size={18} />
            {t('dashboard.manageProducts')}
          </Link>

          <Link
            href="/seller/orders"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
              color: '#ffffff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'border-color 0.2s, background 0.2s'
            }}
          >
            <ClipboardList size={18} />
            {t('dashboard.orderHistory')}
          </Link>

          <Link
            href="/seller/sales-report"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
              color: '#ffffff',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'border-color 0.2s, background 0.2s'
            }}
          >
            <BarChart3 size={18} />
            {t('dashboard.salesReport')}
          </Link>
        </div>

        {/* Products Section with Search Bar */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #262626',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: '#ffffff', fontSize: '16px', fontWeight: '600', margin: 0 }}>
              {t('dashboard.recentProducts')}
            </h3>
            <Link 
              href="/seller/products"
              style={{ color: '#888888', fontSize: '12px', cursor: 'pointer', textDecoration: 'none' }}
            >
              {t('dashboard.viewAll')} →
            </Link>
          </div>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: '16px'
          }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('dashboard.searchPlaceholder')}
              style={{
                width: '100%',
                padding: '10px 14px',
                paddingLeft: '40px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #262626',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#38bdf8';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#262626';
              }}
            />
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666666'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#666666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px 8px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Search Result Count */}
          {searchTerm && (
            <div style={{
              color: '#888888',
              fontSize: '12px',
              marginBottom: '12px'
            }}>
              {t('dashboard.found')} {filteredProducts.length} {filteredProducts.length === 1 ? t('dashboard.product') : t('dashboard.products')}
            </div>
          )}
          
          {filteredProducts.length === 0 ? (
            <div style={{ color: '#888888', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              {searchTerm ? t('dashboard.noMatch') : t('dashboard.noProducts')}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              {filteredProducts.slice(0, 4).map((product) => {
                const stock = product.stock || 0;
                const isLowStock = stock > 0 && stock < 10;
                const isOutOfStock = stock === 0;
                
                return (
                  <div
                    key={product.id}
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: isOutOfStock ? '2px solid #ef4444' : 
                              isLowStock ? '2px solid #f59e0b' : 
                              '1px solid #262626',
                      transition: 'transform 0.2s, border-color 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#38bdf8';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      if (isOutOfStock) {
                        e.currentTarget.style.borderColor = '#ef4444';
                      } else if (isLowStock) {
                        e.currentTarget.style.borderColor = '#f59e0b';
                      } else {
                        e.currentTarget.style.borderColor = '#262626';
                      }
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&h=800&auto=format&fit=crop'}
                      alt={product.title || 'Product'}
                      style={{
                        width: '100%',
                        height: '140px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&h=800&auto=format&fit=crop';
                      }}
                    />
                    <div style={{ padding: '10px 12px 12px 12px' }}>
                      <h4 style={{ 
                        color: '#ffffff', 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        margin: '0 0 4px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {product.title || 'Untitled'}
                      </h4>
                      <p style={{ color: '#38bdf8', fontSize: '13px', fontWeight: '700', margin: '0 0 2px 0' }}>
                        {product.price || 'N/A'}
                      </p>
                      
                      {/* Stock Display */}
                      <p style={{ 
                        color: isOutOfStock ? '#ef4444' : 
                               isLowStock ? '#f59e0b' : 
                               '#22c55e', 
                        fontSize: '11px', 
                        fontWeight: '600', 
                        margin: '0 0 2px 0' 
                      }}>
                        📦 {isOutOfStock ? t('dashboard.outOfStock') : 
                            isLowStock ? `⚠️ ${stock} ${t('dashboard.left')}` : 
                            `${stock} ${t('dashboard.inStock')}`}
                      </p>
                      
                      <p style={{ color: '#666666', fontSize: '10px', margin: '0' }}>
                        {product.category || 'Uncategorized'} • {product.brand || 'No Brand'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}