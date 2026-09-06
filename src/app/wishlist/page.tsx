// app/wishlist/page.tsx
'use client';

import { useWishlist } from '@/context/WishlistContext';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';


interface Product {
  id: string;
  title: string;
  name?: string;
  price: number;
  image?: string;
  images?: string[];
  sellerId?: string;
  stock?: number;
}

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Wishlist ထဲက Product IDs တွေကို Firestore ကနေ ဆွဲယူမယ်
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoadingProducts(false);
        return;
      }

      setLoadingProducts(true);
      try {
        const productPromises = wishlist.map(async (productId) => {
          const docRef = doc(db, 'products', productId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Product;
          }
          return null;
        });

        const results = await Promise.all(productPromises);
        const validProducts = results.filter((p): p is Product => p !== null);
        setProducts(validProducts);
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist]);

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const isLoading = loading || loadingProducts;

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '20px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: '14px' }}>Loading wishlist...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '20px'
      }}>
        <Heart size={64} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontSize: '20px' }}>
          ❤️ Your wishlist is empty
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>
          Start saving your favorite items by tapping the heart icon on products!
        </p>
        <Link
          href="/"
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: 'var(--accent)',
            color: '#000',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '600' }}>
          ❤️ My Wishlist
        </h1>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: '14px',
          backgroundColor: 'var(--card-background)',
          padding: '4px 12px',
          borderRadius: '12px',
          border: '1px solid var(--card-border)'
        }}>
          {products.length} items
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--card-background)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Product Image */}
            <Link
              href={`/product/${product.id}`}
              style={{ flexShrink: 0 }}
            >
              <img
                src={product.image || product.images?.[0] || '/placeholder.png'}
                alt={product.title || product.name || 'Product'}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  backgroundColor: 'var(--input-background)'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.png';
                }}
              />
            </Link>

            {/* Product Info */}
            <Link
              href={`/product/${product.id}`}
              style={{
                flex: 1,
                textDecoration: 'none',
                minWidth: 0
              }}
            >
              <div style={{
                color: 'var(--text-primary)',
                fontWeight: '500',
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {product.title || product.name || 'Product'}
              </div>
              <div style={{
                color: 'var(--accent)',
                fontWeight: '600',
                fontSize: '15px',
                marginTop: '4px'
              }}>
                {product.price?.toLocaleString()} MMK
              </div>
              {product.stock !== undefined && (
                <div style={{
                  fontSize: '11px',
                  color: product.stock > 0 ? 'var(--success)' : 'var(--error)',
                  marginTop: '2px'
                }}>
                  {product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock'}
                </div>
              )}
            </Link>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
              <button
                onClick={() => handleRemove(product.id)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--card-border)',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <Trash2 size={14} />
              </button>
              <button
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => {
                  // Add to cart logic ထည့်ရန်
                  alert(`Added ${product.title || product.name} to cart!`);
                }}
              >
                <ShoppingCart size={14} />
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}