'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import ChatList from '@/components/ChatList';
import ChatRoom from '@/components/ChatRoom';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function ChatPage() {
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      const fetchLanguage = async () => {
        try {
          const userRef = doc(db, 'users', user.uid);
          const snapshot = await getDoc(userRef);
          if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.language) {
              setLanguage(data.language);
            }
          }
        } catch (error) {
          console.error('Error loading language:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchLanguage();
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', height: 'calc(100vh - 32px)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <Link
            href="/"
            style={{ color: '#38bdf8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: '13px' }}>{language === 'my' ? 'နောက်သို့' : 'Back'}</span>
          </Link>
          <h1 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            {language === 'my' ? 'စကားပြောခန်း' : 'Chat'}
          </h1>
        </div>

        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #262626',
          borderRadius: '12px',
          overflow: 'hidden',
          height: 'calc(100% - 60px)'
        }}>
          {selectedChatId ? (
            <ChatRoom
              chatId={selectedChatId}
              onBack={() => setSelectedChatId(null)}
              currentUserId={currentUser?.uid}
            />
          ) : (
            <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
              <ChatList onChatSelect={(chatId) => {
                console.log('🔍 Chat selected from ChatList:', chatId);
                setSelectedChatId(chatId);
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}