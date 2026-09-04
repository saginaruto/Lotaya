'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  doc, getDoc, collection, query, where, onSnapshot, 
  deleteDoc, updateDoc 
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Package, PlusCircle, Search, 
  Edit, Trash2, X, Check 
} from 'lucide-react';
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

export default function ManageProducts() {
  const { t } = useLanguage();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});

  // ✅ Helper function for createdAt
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
            if (data.role !== 'seller') {
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

  // Real-time listener - ✅ ဒီနေရာကို သေချာကြည့်ပါ
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
          
          // ✅ localeCompare မပါဘူး - getCreatedAtTime ကိုသုံးထားတယ်
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

  // Search filter
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.price?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Delete product
  const handleDelete = async (productId: string, productTitle: string) => {
    if (!confirm(t('Delete Confirm').replace('{title}', productTitle))) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      alert(t('Delete Success'));
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(`${t('Delete Failed')}: ${error.message}`);
    }
  };

  // Start editing
  const startEditing = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      title: product.title || '',
      price: product.price || '',
      brand: product.brand || '',
      category: product.category || '',
      discount: product.discount || '',
      description: product.description || '',
      image: product.image || '',
      stock: product.stock || 0
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

  // Save edit
  const handleSaveEdit = async (productId: string) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        title: editData.title,
        price: editData.price,
        brand: editData.brand,
        category: editData.category,
        discount: editData.discount,
        description: editData.description,
        image: editData.image,
        stock: editData.stock || 0
      });
      
      alert(t('Update Success'));
      setEditingId(null);
      setEditData({});
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(`${t('Update Failed')}: ${error.message}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        {t('common.loading')}
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

  if (!user || !userData || userData.role !== 'seller') {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link 
              href="/seller/dashboard" 
              style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: 0 }}>
              {t('Products')}
            </h1>
          </div>
          
          <Link
            href="/seller/products/new"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#ffffff',
              color: '#000000',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <PlusCircle size={18} />
            {t('Add New')}
          </Link>
        </div>

        {/* Search Bar */}
        <div style={{
          position: 'relative',
          marginBottom: '20px'
        }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('Search Placeholder')}
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingLeft: '44px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #262626',
              borderRadius: '12px',
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
              left: '14px',
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
                right: '14px',
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

        {/* Product Count */}
        <div style={{
          color: '#888888',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {filteredProducts.length} {filteredProducts.length === 1 ? t('Product') : t('Products')} {t('Found')}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{
            backgroundColor: '#121212',
            border: '1px solid #262626',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <Package size={48} style={{ color: '#444444', marginBottom: '16px' }} />
            <h3 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {searchTerm ? t('No Match') : t('No Products')}
            </h3>
            <p style={{ color: '#888888', fontSize: '14px', margin: '0 0 16px 0' }}>
              {searchTerm ? t('Adjust Search') : t('Start Adding')}
            </p>
            {!searchTerm && (
              <Link
                href="/seller/products/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <PlusCircle size={18} />
                {t('Add New Product')}
              </Link>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px'
          }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  backgroundColor: '#121212',
                  border: editingId === product.id ? '2px solid #38bdf8' : '1px solid #262626',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  transition: 'border-color 0.2s'
                }}
              >
                {/* Product Image */}
                <img
                  src={product.image || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&h=800&auto=format&fit=crop'}
                  alt={product.title || 'Product'}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&h=800&auto=format&fit=crop';
                  }}
                />

                {/* Product Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === product.id ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        placeholder={t('Product Name')}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid #262626',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={editData.price || ''}
                          onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                          placeholder={t('Price')}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            flex: 1,
                            minWidth: '100px'
                          }}
                        />
                        <input
                          type="text"
                          value={editData.brand || ''}
                          onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                          placeholder={t('Brand')}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            flex: 1,
                            minWidth: '100px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={editData.category || ''}
                          onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                          placeholder={t('Category')}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            flex: 1,
                            minWidth: '100px'
                          }}
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={editData.stock ?? ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setEditData({ ...editData, stock: val ? parseInt(val) : 0 });
                          }}
                          placeholder={t('Stock')}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            flex: 1,
                            minWidth: '100px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={editData.discount || ''}
                          onChange={(e) => setEditData({ ...editData, discount: e.target.value })}
                          placeholder={t('Discount')}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            flex: 1,
                            minWidth: '100px'
                          }}
                        />
                        <input
                          type="text"
                          value={editData.image || ''}
                          onChange={(e) => setEditData({ ...editData, image: e.target.value })}
                          placeholder={t('Image URL')}
                          style={{
                            padding: '6px 10px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '13px',
                            outline: 'none',
                            flex: 2,
                            minWidth: '150px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleSaveEdit(product.id)}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#22c55e',
                            color: '#000000',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Check size={14} /> {t('common.save')}
                        </button>
                        <button
                          onClick={cancelEditing}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: 'transparent',
                            border: '1px solid #444444',
                            color: '#888888',
                            borderRadius: '6px',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h4 style={{ 
                            color: '#ffffff', 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            margin: '0 0 4px 0' 
                          }}>
                            {product.title || t('Untitled')}
                          </h4>
                          <p style={{ color: '#38bdf8', fontSize: '18px', fontWeight: '700', margin: '0 0 2px 0' }}>
                            {product.price || 'N/A'}
                          </p>
                          
                          {/* Stock Display */}
                          <p style={{ 
                            color: (product.stock || 0) > 0 ? '#22c55e' : '#ef4444', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            margin: '0 0 4px 0' 
                          }}>
                            📦 {(product.stock || 0) > 0 ? `${product.stock} ${t('In Stock')}` : t('Out of Stock')}
                          </p>
                          
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              color: '#888888', 
                              fontSize: '12px',
                              backgroundColor: '#1a1a1a',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {product.category || t('Uncategorized')}
                            </span>
                            <span style={{ 
                              color: '#888888', 
                              fontSize: '12px',
                              backgroundColor: '#1a1a1a',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {product.brand || t('No Brand')}
                            </span>
                            {product.discount && product.discount !== 'New' && (
                              <span style={{ 
                                color: '#22c55e', 
                                fontSize: '12px',
                                backgroundColor: '#1a2a1a',
                                padding: '2px 8px',
                                borderRadius: '4px'
                              }}>
                                {product.discount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <button
                          onClick={() => startEditing(product)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            color: '#38bdf8',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit size={14} /> {t('common.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.title || t('Untitled'))}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #262626',
                            color: '#ef4444',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={14} /> {t('common.delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}