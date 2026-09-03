// components/NotificationToggle.tsx
'use client';

import { Bell } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';

interface NotificationToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  description?: string;
}

export default function NotificationToggle({
  label,
  checked,
  onChange,
  description
}: NotificationToggleProps) {
  const { t } = useLanguage();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #262626',
        cursor: 'pointer',
        transition: 'border-color 0.2s'
      }}
      onClick={onChange}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#38bdf8';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#262626';
      }}
    >
      <div>
        <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>
          {label}
        </div>
        {description && (
          <div style={{ color: '#888888', fontSize: '11px' }}>
            {description}
          </div>
        )}
      </div>
      <div
        style={{
          width: '44px',
          height: '24px',
          backgroundColor: checked ? '#38bdf8' : '#333333',
          borderRadius: '12px',
          position: 'relative',
          transition: 'background 0.3s ease',
          flexShrink: 0,
          boxShadow: checked ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none'
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            position: 'absolute',
            top: '3px',
            left: checked ? '23px' : '3px',
            transition: 'left 0.3s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}
        />
      </div>
    </div>
  );
}