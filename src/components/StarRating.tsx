// components/StarRating.tsx
'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;              // 1-5
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;          // ကြည့်ရုံပဲလား၊ နှိပ်လို့ရမလား
  size?: number;
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = 24 
}: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleClick = (value: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(value);
  };

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hoveredRating || rating) >= star;
        return (
          <button
            key={star}
            onClick={() => handleClick(star)}
            onMouseEnter={() => !readonly && setHoveredRating(star)}
            onMouseLeave={() => !readonly && setHoveredRating(0)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              cursor: readonly ? 'default' : 'pointer',
              padding: '2px',
              transition: 'transform 0.2s ease'
            }}
            disabled={readonly}
          >
            <Star
              size={size}
              style={{
                fill: filled ? '#F59E0B' : 'none',
                stroke: filled ? '#F59E0B' : 'var(--text-muted)',
                transition: 'all 0.2s ease',
                transform: filled ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          </button>
        );
      })}
    </div>
  );
}