// components/MessageBubble.tsx
'use client';

import { Check } from 'lucide-react';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showReadReceipt?: boolean;
}

export default function MessageBubble({ 
  message, 
  isOwn,
  showReadReceipt = true 
}: MessageBubbleProps) {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // ✅ Read Receipt Status - အမှန်ခြစ်နှစ်ခု တစ်ခုနှင့်တစ်ခု ထပ်နေပြီး အရောင်တစ်ူတည်းရှိသော ပုံစံ
  const getReadStatus = () => {
    if (!showReadReceipt) return null;
    
    // Bubble အရောင်အလိုက် အရောင်သတ်မှတ်ချက် (နှစ်ခုစလုံးအတွက် တူညီသော အရောင်သုံးမည်)
    const iconColor = isOwn ? 'var(--text-muted)' : '#34b7f1';
    
    if (message.read === true) {
      return (
        <svg 
          width="16" 
          height="14" 
          viewBox="0 0 20 14" 
          fill="none" 
          stroke={iconColor} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}
        >
          {/* ဘယ်ဘက်က (နောက်ဘက်) အမှန်ခြစ် */}
          <path d="M1 8l3.5 3.5L12 4" />
          {/* ညာဘက်က (ရှေ့ဘက်) အမှန်ခြစ် - တစ်ခုနှင့်တစ်ခု ထပ်နေစေရန် နေရာ အနည်းငယ် ရွှေ့ထားသည် */}
          <path d="M8 8l3.5 3.5L19 4" />
        </svg>
      );
    }
    return <Check size={14} style={{ color: iconColor, marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  const readStatus = getReadStatus();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '8px',
      width: '100%'
    }}>
      <div style={{
        backgroundColor: isOwn ? 'var(--accent)' : 'var(--card-background)',
        color: isOwn ? '#000' : 'var(--foreground)',
        padding: '10px 14px',
        borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
        maxWidth: '75%',
        wordBreak: 'break-word',
        position: 'relative'
      }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {message.message}
        </div>
        
        {/* ✅ Timestamp + Read Receipt */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '4px',
          marginTop: '4px'
        }}>
          <span style={{
            fontSize: '10px',
            color: isOwn ? '#00000080' : 'var(--text-muted)'
          }}>
            {formatTime(message.timestamp)}
          </span>
          {readStatus}
        </div>
      </div>
    </div>
  );
}