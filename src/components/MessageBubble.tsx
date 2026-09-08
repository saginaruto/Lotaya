// components/MessageBubble.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Trash2, X, Reply } from 'lucide-react';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showReadReceipt?: boolean;
  onReply?: (message: any) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string, forEveryone: boolean) => void;
  currentUserId?: string;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export default function MessageBubble({ 
  message, 
  isOwn,
  showReadReceipt = true,
  onReply,
  onReaction,
  onDelete,
  currentUserId,
}: MessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const closeAll = () => {
    setShowEmojiPicker(false);
    setShowActionMenu(false);
    setShowDeleteConfirm(false);
  };

  // ============================================
  // ✅ Click Outside → Close All
  // ============================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };

    if (showEmojiPicker || showActionMenu || showDeleteConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showEmojiPicker, showActionMenu, showDeleteConfirm]);

  // ============================================
  // ✅ Page ကနေထွက်ရင် ပိတ်မယ်
  // ============================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        closeAll();
      }
    };

    const handlePageHide = () => {
      closeAll();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // ✅ Read Receipt
  const getReadStatus = () => {
    if (!showReadReceipt) return null;
    const iconColor = isOwn ? 'var(--text-muted)' : '#34b7f1';
    
    if (message.read === true) {
      return (
        <svg width="16" height="14" viewBox="0 0 20 14" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
          <path d="M1 8l3.5 3.5L12 4" />
          <path d="M8 8l3.5 3.5L19 4" />
        </svg>
      );
    }
    return <Check size={14} style={{ color: iconColor, marginLeft: '4px', verticalAlign: 'middle' }} />;
  };

  // ✅ Render Reactions
  const renderReactions = () => {
    if (!message.reactions || Object.keys(message.reactions).length === 0) return null;
    
    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginTop: '4px',
        alignItems: 'center',
      }}>
        {Object.entries(message.reactions).map(([emoji, userIds]) => {
          if (!Array.isArray(userIds) || userIds.length === 0) return null;
          const isUserReacted = userIds.includes(currentUserId || '');
          return (
            <span key={emoji} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '13px',
              padding: '2px 6px',
              borderRadius: '12px',
              backgroundColor: isUserReacted ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.05)',
              cursor: 'pointer',
              border: isUserReacted ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
              zIndex: 10, // 🔑 Reaction များကို Bubble ပေါ်မှာ ထင်ရှားစေရန်
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
              }
              if (onReaction) {
                onReaction(message.id, emoji);
              }
            }}
            onPointerDown={(e) => {
              // 🔑 Reaction ကို ဖိလိုက်ရင် Long press မစတင်စေရန် တားဆီးခြင်း
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
              }
            }}
            >
              <span>{emoji}</span>
              <span style={{ fontSize: '11px', fontWeight: '500' }}>{userIds.length}</span>
            </span>
          );
        })}
      </div>
    );
  };

  // ✅ Delete Message Check
  const isDeletedForMe = message.deletedFor?.includes(currentUserId || '');
  const isDeleted = message.deleted === true;

  if (isDeleted) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
        width: '100%',
      }}>
        <div style={{
          backgroundColor: 'var(--card-background)',
          color: 'var(--text-muted)',
          padding: '8px 14px',
          borderRadius: '12px',
          fontSize: '13px',
          fontStyle: 'italic',
          border: '1px dashed var(--card-border)',
        }}>
          🚫 This message was deleted
        </div>
      </div>
    );
  }

  if (isDeletedForMe) return null;

  // ============================================
  // ၁။ SWIPE → REPLY
  // ============================================
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setIsSwiping(false);
    setSwipeOffset(0);
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    
    const touch = e.touches[0];
    const diff = touch.clientX - touchStartX;
    
    const isSwipeInward = isOwn ? diff < 0 : diff > 0;
    
    if (isSwipeInward && Math.abs(diff) > 10) {
      if (e.cancelable) {
        e.preventDefault();
      }
      setIsSwiping(true);
      const maxOffset = 80;
      const offset = Math.min(Math.abs(diff), maxOffset);
      setSwipeOffset(isOwn ? -offset : offset);
    } else {
      setIsSwiping(false);
      setSwipeOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (isSwiping && Math.abs(swipeOffset) > 50) {
      if (onReply) {
        onReply(message);
      }
    }
    
    setTouchStartX(null);
    setIsSwiping(false);
    setSwipeOffset(0);
  };

  // ============================================
  // ၂။ DOUBLE TAP → ❤️ AUTO-REACTION
  // ============================================
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    const now = Date.now();
    const lastTap = lastTapRef.current;
    
    if (now - lastTap < 300) {
      if (onReaction) {
        onReaction(message.id, '❤️');
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  // ============================================
  // ၃။ LONG PRESS → Emoji + Reply + Delete (၃ ခုပဲ)
  // ============================================
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      showMenu();
      return;
    }
    
    longPressTimer.current = setTimeout(() => {
      showMenu();
    }, 500);
  };

  const showMenu = () => {
    setShowEmojiPicker(true);
    setShowActionMenu(true);
    setShowDeleteConfirm(false);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ============================================
  // ၄။ DELETE → နှိပ်ရင် Emoji + Reply ပျောက်ပြီး Delete Options ပဲကျန်မယ်
  // ============================================
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setShowEmojiPicker(false);
    setShowActionMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteAction = (forEveryone: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(message.id, forEveryone);
    }
    closeAll();
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: '8px',
        width: '100%',
        position: 'relative',
        overflow: 'visible',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleDoubleTap}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Swipe Reply Preview */}
      {isSwiping && Math.abs(swipeOffset) > 20 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          transform: 'translateY(-50%)',
          [isOwn ? 'right' : 'left']: '100%',
          marginLeft: isOwn ? '8px' : '0',
          marginRight: isOwn ? '0' : '8px',
          backgroundColor: 'var(--accent)',
          color: '#000',
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          opacity: Math.min(Math.abs(swipeOffset) / 80, 1),
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
        }}>
          ↪ Reply
        </div>
      )}

      {/* ============================================ */}
      {/* Message Bubble + Side Menu Container */}
      {/* ============================================ */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '4px',
        width: '100%',
        // 🔑 ကိုယ့်စာ (isOwn = true) ဆိုရင် မက်ဆေ့ကို ညာဘက်တင်ပြီး Menu က ဘယ်ဘက်ကပ်မယ်၊ သူများစာဆိုရင် ဘယ်ဘက်စမယ်
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        flexDirection: 'row',
      }}>
        {/* ============================================ */}
        {/* ✅ Menu (ဘယ်ဘက် သို့မဟုတ် ညာဘက် - Message ရဲ့ဘေး) */}
        {/* ============================================ */}
        {(showEmojiPicker || showActionMenu) && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            // 🔑 ညာဘက်စာအတွက် Menu ရဲ့ စာသား/အရာများကို ဘယ်ဘက်ကပ်ရန် (alignItems: 'flex-start' သို့မဟုတ် 'flex-end')
            alignItems: isOwn ? 'flex-end' : 'flex-start',
            flexShrink: 0,
            // 🔑 သူများစာ (isOwn = false) ဆိုရင် Menu က ညာဘက် (order: 2)၊ ကိုယ့်စာ (isOwn = true) ဆိုရင် Menu က ဘယ်ဘက် (order: 0)
            order: isOwn ? 0 : 2,  
          }}>
            {/* ✅ Emoji Picker (အပေါ်မှာ) */}
            {showEmojiPicker && (
              <div style={{
                backgroundColor: 'var(--card-background)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '4px 6px',
                display: 'flex',
                gap: '1px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 30,
                flexWrap: 'nowrap',
                maxWidth: '200px',
                justifyContent: 'center',
              }}
              >
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onReaction) {
                        onReaction(message.id, emoji);
                      }
                      closeAll();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '22px',
                      padding: '2px 4px',
                      borderRadius: '6px',
                      transition: 'background 0.2s, transform 0.2s',
                      width: '30px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
                      e.currentTarget.style.transform = 'scale(1.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* ✅ Action Menu (အောက်မှာ - Reply + Delete) */}
            {showActionMenu && (
              <div style={{
                backgroundColor: 'var(--card-background)',
                border: '1px solid var(--card-border)',
                borderRadius: '10px',
                padding: '3px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                zIndex: 30,
                minWidth: '120px',
              }}
              >
                {/* Reply Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onReply) {
                      onReply(message);
                    }
                    closeAll();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    width: '100%',
                    padding: '4px 10px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--foreground)',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Reply size={14} /> Reply
                </button>

                {/* Delete Button - ကိုယ်ပို့တာမှသာ */}
                {isOwn && (
                  <button
                    onClick={handleDeleteClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      padding: '4px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: '#f87171',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.12)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}

                {/* ✅ DELETE SUB-OPTIONS */}
                {showDeleteConfirm && isOwn && (
                  <div style={{
                    marginTop: '2px',
                    paddingTop: '3px',
                    borderTop: '1px solid var(--card-border)',
                  }}>
                    <button
                      onClick={(e) => handleDeleteAction(true, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        padding: '4px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#f87171',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={13} /> Delete for everyone
                    </button>
                    <button
                      onClick={(e) => handleDeleteAction(false, e)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        width: '100%',
                        padding: '4px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: '500',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(128, 128, 128, 0.08)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <X size={13} /> Delete for me only
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div style={{
          backgroundColor: isOwn ? 'var(--accent)' : 'var(--card-background)',
          color: isOwn ? '#000' : 'var(--foreground)',
          padding: '10px 14px',
          borderRadius: isOwn ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
          maxWidth: '75%',
          wordBreak: 'break-word',
          position: 'relative',
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease',
          touchAction: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          // 🔑 မက်ဆေ့ကိုယ်တိုင်က အမြဲတမ်း order: 1 မှာ နေမယ်
          order: 1, 
        }}>
          {/* Reply Preview */}
          {message.replyTo && (
            <div 
              style={{
                backgroundColor: isOwn ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)',
                borderLeft: `3px solid ${isOwn ? '#34b7f1' : 'var(--text-muted)'}`,
                padding: '4px 8px',
                borderRadius: '4px',
                marginBottom: '6px',
                fontSize: '12px',
                color: isOwn ? '#00000080' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (message.replyTo?.id) {
                  const el = document.getElementById(`msg-${message.replyTo.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
            >
              <div style={{ fontWeight: '600', fontSize: '11px' }}>
                {message.replyTo.senderId === message.senderId ? 'You' : 'Them'}
              </div>
              <div style={{ 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                maxWidth: '200px'
              }}>
                {message.replyTo.message}
              </div>
            </div>
          )}
          
          {/* Message Text */}
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {message.message}
          </div>
          
          {/* Reactions Display + Time */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            marginTop: '4px',
            flexWrap: 'wrap',
          }}>
            {renderReactions()}
            
            <span style={{
              fontSize: '10px',
              color: isOwn ? '#00000080' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
            }}>
              {formatTime(message.timestamp)}
              {getReadStatus()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}