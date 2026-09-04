'use client';

import { useState, useEffect, useRef } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, Upload, X } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { uploadToCloudinary } from '@/lib/cloudinary';

export default function AddProduct() {
  const { t } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productDiscount, setProductDiscount] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productBrand, setProductBrand] = useState('');
  const [productStock, setProductStock] = useState('');

  const categories = ['Fashion', 'Electronics', 'Beauty & Care', 'Groceries', 
                       'Home & Living', 'Mobile Accessories', 'Sports & Fitness', 
                       'Toys & Games', 'Books & Stationery'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snapshot = await getDoc(userRef);
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);
            if (data.role !== 'seller') {
              router.push('/');
            }
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // ✅ ပုံတင်တဲ့ function (Cloudinary ကိုသုံးမယ်)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ပုံအရွယ်အစားစစ်ပါ (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      const imageUrl = await uploadToCloudinary(file);
      setProductImage(imageUrl);
      alert('✅ Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ ပုံဖယ်တဲ့ function
  const removeImage = () => {
    setProductImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert(t('Login First'));
      router.push('/Login');
      return;
    }

    setSubmitting(true);

    try {
      const productData = {
        brand: productBrand || 'D Saing Store',
        location: userData?.shopAddress || 'Yangon',
        title: productName,
        price: productPrice,
        discount: productDiscount || 'New',
        image: productImage || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&h=800&auto=format&fit=crop',
        cta: 'Contact Seller',
        category: productCategory,
        description: productDescription,
        sellerId: user.uid,
        sellerName: userData?.username || userData?.displayName || 'Seller',
        createdAt: serverTimestamp(),
        stock: parseInt(productStock) || 0
      };

      console.log('📦 Adding product:', productData);

      await addDoc(collection(db, 'products'), productData);

      alert(t('Add Success'));
      window.location.href = '/seller/dashboard';

    } catch (error: any) {
      console.error('Error adding product:', error);
      alert(`${t('Add Failed')}: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link href="/seller/dashboard" style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '14px' }}>
          <ArrowLeft size={18} />
        </Link>

        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #262626',
          borderRadius: '14px',
          padding: '20px'
        }}>
          <h1 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '0 0 4px 0' }}>
            {t('Add Title')}
          </h1>
          <p style={{ color: '#888888', fontSize: '13px', margin: '0 0 20px 0' }}>
            {t('Add Description')}
          </p>

          <form onSubmit={handleSubmit}>
            {/* Product Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('Product Name')}
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Premium Sneakers"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Brand */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('Product Brand')}
              </label>
              <input
                type="text"
                value={productBrand}
                onChange={(e) => setProductBrand(e.target.value)}
                placeholder="e.g., Nike, Apple"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Price */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('product.price')}
              </label>
              <input
                type="text"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                placeholder="e.g., 450,000 MMK"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('product.category')}
              </label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="">{t('product.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Stock Quantity */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('product.stock')}
              </label>
              <input
                type="number"
                min="0"
                value={productStock}
                onChange={(e) => setProductStock(e.target.value)}
                placeholder="e.g., 100"
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Location - Disabled */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('product.location')}
              </label>
              <input
                type="text"
                value={userData?.shopAddress || 'Yangon'}
                disabled
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#666666',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Discount */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('product.discount')}
              </label>
              <input
                type="text"
                value={productDiscount}
                onChange={(e) => setProductDiscount(e.target.value)}
                placeholder="e.g., 20% OFF, Buy 1 Get 1"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* ===== ✅ Image Upload ===== */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('product.image')}
              </label>
              
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: uploadingImage ? 'default' : 'pointer',
                    opacity: uploadingImage ? 0.5 : 1,
                    fontSize: '13px'
                  }}
                >
                  {uploadingImage ? (
                    <>⏳ Uploading...</>
                  ) : (
                    <>
                      <Upload size={16} />
                      Choose Image
                    </>
                  )}
                </button>

                {/* Camera Button (Mobile) */}
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.setAttribute('capture', 'environment');
                      fileInputRef.current.click();
                    }
                  }}
                  disabled={uploadingImage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: uploadingImage ? 'default' : 'pointer',
                    opacity: uploadingImage ? 0.5 : 1,
                    fontSize: '13px'
                  }}
                >
                  <Camera size={16} />
                  Take Photo
                </button>

                {/* Remove Button (if image exists) */}
                {productImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: '#2a1a1a',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <X size={14} />
                    Remove
                  </button>
                )}
              </div>

              {/* Image Preview */}
              {productImage && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    border: '1px solid #262626'
                  }}
                >
                  <img
                    src={productImage}
                    alt="Product preview"
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=600&h=800&auto=format&fit=crop';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ color: '#888888', fontSize: '12px', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                {t('product.description')}
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe your product..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #262626',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: (submitting || uploadingImage) ? 'default' : 'pointer',
                opacity: (submitting || uploadingImage) ? 0.6 : 1,
                boxSizing: 'border-box'
              }}
            >
              {submitting ? t('common.saving') : t('product.addButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}