'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { listenUserChats, ChatRoom } from '@/lib/chat';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface ChatListProps {
  onChatSelect?: (chatId: string) => void;
}

export default function ChatList({ onChatSelect }: ChatListProps) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>('en');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
  }, []);

  // Get language
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeLang = onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.language) {
          setLanguage(data.language);
        }
      }
    });

    return () => unsubscribeLang();
  }, [user]);

  // Get chats and listen for new messages
  useEffect(() => {
    if (!user) return;

    const unsubscribeChats = listenUserChats(user.uid, (chatRooms) => {
      console.log('✅ Chats loaded:', chatRooms.length);
      setChats(chatRooms);
      setLoading(false);
    });

    return () => {
      unsubscribeChats();
    };
  }, [user]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      my: {
        'No messages yet': 'စာမရှိသေးပါ',
        'Unnamed Chat': 'အမည်မသိ စကားပြောခန်း',
        'Loading...': 'ဝင်နေသည်...',
      },
      en: {
        'No messages yet': 'No messages yet',
        'Unnamed Chat': 'Unnamed Chat',
        'Loading...': 'Loading...',
      }
    };
    return translations[language]?.[key] || translations.en[key] || key;
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#888888' }}>
        {t('Loading...')}
      </div>
    );
  }

  const filteredChats = chats;

  if (filteredChats.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#888888' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
        <p>{t('No messages yet')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {filteredChats.map((chat) => {
        // ✅ တိုက်ရိုက်ယူသုံးရန်
        const displayName = chat.otherUserName || t('Unnamed Chat');
        const displayPhoto = chat.otherUserPhoto || null;

        return (
          <div
            key={chat.id}
            onClick={() => {
              if (onChatSelect) {
                onChatSelect(chat.id);
              } else {
                router.push(`/chat/${chat.id}`);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: '#121212',
              borderRadius: '12px',
              border: chat.unreadCount > 0 ? '2px solid #38bdf8' : '1px solid #262626',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#121212';
            }}
          >
            {/* Profile Picture */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={displayName}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #262626'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=38bdf8&color=ffffff&size=48';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#1a1a1a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '20px',
                    fontWeight: '600',
                    border: '2px solid #262626'
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '70%'
                }}>
                  {displayName}
                </div>
                {chat.unreadCount > 0 && (
                  <div style={{
                    backgroundColor: '#38bdf8',
                    color: '#000000',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    flexShrink: 0
                  }}>
                    {chat.unreadCount}
                  </div>
                )}
              </div>
              
              <div style={{ 
                color: chat.lastMessage ? '#888888' : '#555555', 
                fontSize: '12px', 
                marginTop: '2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {chat.lastMessage || t('No messages yet')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}