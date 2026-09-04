'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ChatRoom from '@/components/ChatRoom';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>('en');
  const [userRole, setUserRole] = useState<'user' | 'seller'>('user');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      try {
        // 1. Fetch user language
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.language) {
            setLanguage(data.language);
          }
          if (data.role === 'seller' || data.role === 'VENDOR') {
            setUserRole('seller');
          }
        }
      } catch (error) {
        console.error('Error determining user role:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [chatId, router]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#000000', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#ffffff' 
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', height: 'calc(100vh - 32px)' }}>
        {/* Back Button - ✅ ပြင်ဆင်ပြီး */}
        <div style={{ marginBottom: '16px' }}>
          <Link
            href="/messages"
            style={{ 
              color: '#38bdf8', 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px' 
            }}
          >
            <ArrowLeft size={18} />
            <span style={{ fontSize: '13px' }}>
              {language === 'my' ? 'နောက်သို့' : 'Back'}
            </span>
          </Link>
        </div>

        <div style={{
          backgroundColor: '#121212',
          border: '1px solid #262626',
          borderRadius: '12px',
          overflow: 'hidden',
          height: 'calc(100% - 60px)'
        }}>
          <ChatRoom 
            chatId={chatId} 
            userRole={userRole} 
            currentUserId={currentUser?.uid} 
          />
        </div>
      </div>
    </div>
  );
}