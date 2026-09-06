// ManageProducts.tsx - Dark/Light Mode အတွက် ပြင်ဆင်ပြီး
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

  const cancelEditing = () => {
    setEditingId(null);
    setEditData({});
  };

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

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--background)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--foreground)'
      }}>
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--background)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'var(--foreground)',
        gap: '16px',
        padding: '20px'
      }}>
        <div style={{ color: 'var(--error)', fontSize: '20px' }}>⚠️ {t('common.error')}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            backgroundColor: 'var(--accent)',
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
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
              style={{ color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 style={{ color: 'var(--foreground)', fontSize: '20px', fontWeight: '700', margin: 0 }}>
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
              backgroundColor: 'var(--accent)',
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
              backgroundColor: 'var(--input-background)',
              border: '1px solid var(--input-border)',
              borderRadius: '12px',
              color: 'var(--foreground)',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--input-border)';
            }}
          />
          <Search 
            size={18} 
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
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
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '16px'
        }}>
          {filteredProducts.length} {filteredProducts.length === 1 ? t('Product') : t('Products')} {t('Found')}
        </div>

        {filteredProducts.length === 0 ? (
          <div style={{
            backgroundColor: 'var(--card-background)',
            border: '1px solid var(--card-border)',
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--foreground)', fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              {searchTerm ? t('No Match') : t('No Products')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 16px 0' }}>
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
                  backgroundColor: 'var(--accent)',
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
                  backgroundColor: 'var(--card-background)',
                  border: editingId === product.id ? '2px solid var(--accent)' : '1px solid var(--card-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  transition: 'border-color 0.2s'
                }}
              >
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

                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === product.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        placeholder={t('Product Name')}
                        style={{
                          padding: '6px 10px',
                          backgroundColor: 'var(--input-background)',
                          border: '1px solid var(--input-border)',
                          borderRadius: '6px',
                          color: 'var(--foreground)',
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
                            backgroundColor: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
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
                            backgroundColor: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
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
                            backgroundColor: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
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
                            backgroundColor: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
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
                            backgroundColor: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
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
                            backgroundColor: 'var(--input-background)',
                            border: '1px solid var(--input-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
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
                            backgroundColor: 'var(--success)',
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
                            border: '1px solid var(--card-border)',
                            color: 'var(--text-secondary)',
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
                    <>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <h4 style={{ 
                            color: 'var(--foreground)', 
                            fontSize: '16px', 
                            fontWeight: '600', 
                            margin: '0 0 4px 0' 
                          }}>
                            {product.title || t('Untitled')}
                          </h4>
                          <p style={{ color: 'var(--accent)', fontSize: '18px', fontWeight: '700', margin: '0 0 2px 0' }}>
                            {product.price || 'N/A'}
                          </p>
                          
                          <p style={{ 
                            color: (product.stock || 0) > 0 ? 'var(--success)' : 'var(--error)', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            margin: '0 0 4px 0' 
                          }}>
                            📦 {(product.stock || 0) > 0 ? `${product.stock} ${t('In Stock')}` : t('Out of Stock')}
                          </p>
                          
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ 
                              color: 'var(--text-secondary)', 
                              fontSize: '12px',
                              backgroundColor: 'var(--hover-background)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {product.category || t('Uncategorized')}
                            </span>
                            <span style={{ 
                              color: 'var(--text-secondary)', 
                              fontSize: '12px',
                              backgroundColor: 'var(--hover-background)',
                              padding: '2px 8px',
                              borderRadius: '4px'
                            }}>
                              {product.brand || t('No Brand')}
                            </span>
                            {product.discount && product.discount !== 'New' && (
                              <span style={{ 
                                color: 'var(--success)', 
                                fontSize: '12px',
                                backgroundColor: 'var(--card-background)',
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
                            backgroundColor: 'var(--hover-background)',
                            border: '1px solid var(--card-border)',
                            color: 'var(--accent)',
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
                            backgroundColor: 'var(--hover-background)',
                            border: '1px solid var(--card-border)',
                            color: 'var(--error)',
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