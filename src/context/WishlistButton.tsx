// components/WishlistButton.tsx
'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';

interface WishlistButtonProps {
  productId: string;
  size?: number;
}

export default function WishlistButton({ productId, size = 24 }: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Product click မဖြစ်အောင်
    
    if (isWishlisted) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        backgroundColor: 'var(--card-background)',
        border: '1px solid var(--card-border)',
        borderRadius: '50%',
        padding: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        width: '40px',
        height: '40px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--hover-background)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--card-background)';
      }}
    >
      <Heart
        size={size}
        style={{
          fill: isWishlisted ? '#ef4444' : 'none',
          stroke: isWishlisted ? '#ef4444' : 'var(--text-secondary)',
          transition: 'all 0.3s',
          transform: isWishlisted ? 'scale(1.1)' : 'scale(1)'
        }}
      />
    </button>
  );
}