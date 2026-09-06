// lib/chat.ts
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  limit,
  setDoc,
  writeBatch,
  increment
} from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  message: string;
  image?: string;
  timestamp: any;
  read: boolean;
  type?: 'text' | 'image' | 'order';
  orderId?: string;
  orderData?: any;
  _offline?: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount: number;
  productId?: string;
  productTitle?: string;
  productImage?: string;
  sellerId?: string;
  buyerId?: string;
  sellerName?: string;
  lastMessageSenderId?: string;
  otherUserName?: string;
  otherUserPhoto?: string;
}

export const createChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// Chat Room ကိုရှာပြီး မရှိရင် null ပြန်မယ်
export const getChatRoom = async (
  userId1: string,
  userId2: string,
  productId?: string
): Promise<string | null> => {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required');
  }

  const chatId = createChatId(userId1, userId2);
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  
  if (chatSnap.exists()) {
    return chatSnap.id;
  }
  
  if (productId) {
    const q = query(
      collection(db, 'chats'),
      where('productId', '==', productId),
      where('participants', 'array-contains', userId1)
    );
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      return querySnap.docs[0].id;
    }
  }
  
  return null;
};

// Chat Room အသစ်ဖန်တီးတဲ့ function
export const createChatRoom = async (
  userId1: string,
  userId2: string,
  productId?: string,
  productTitle?: string,
  productImage?: string,
  sellerId?: string,
  sellerName?: string
): Promise<string> => {
  if (!userId1 || !userId2) {
    throw new Error('Both user IDs are required');
  }

  const chatId = createChatId(userId1, userId2);
  const chatRef = doc(db, 'chats', chatId);

  const actualSellerId = sellerId || userId2;
  const actualBuyerId = userId1 === actualSellerId ? userId2 : userId1;
  const chatData = {
    participants: [userId1, userId2],
    buyerId: actualBuyerId,
    sellerId: actualSellerId,
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastMessageTime: serverTimestamp(),
    unreadCount: {},
    productId: productId || '',
    productTitle: productTitle || '',
    productImage: productImage || '',
    sellerName: sellerName || ''
  };

  try {
    await setDoc(chatRef, chatData, { merge: true });
  } catch (error: any) {
    if (error?.code !== 'permission-denied') throw error;
    const freshChat = await addDoc(collection(db, 'chats'), chatData);
    await createUserChatIndexes(freshChat.id, userId1, userId2, chatData);
    return freshChat.id;
  }

  await createUserChatIndexes(chatId, userId1, userId2, chatData);
  return chatId;
};

const createUserChatIndexes = async (chatId: string, userId1: string, userId2: string, chatData: any) => {
  const indexData = {
    lastMessage: '',
    lastMessageTime: chatData.lastMessageTime,
    unreadCount: 0,
    lastMessageSenderId: '',
  };
  await Promise.all([
    setDoc(doc(db, 'userChats', userId1, 'chats', chatId), indexData, { merge: true }),
    setDoc(doc(db, 'userChats', userId2, 'chats', chatId), indexData, { merge: true }),
  ]);
};

// ===== ✅ ပြင်ဆင်ပြီးသား sendPushNotification (Server-Side API ကိုခေါ်မယ်) =====
const sendPushNotification = async (userId: string, title: string, body: string, chatId: string) => {
  try {
    // ✅ API Route ကိုခေါ်ပါ (Server-Side)
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        chatId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Notification API error:', data.error);
      return;
    }

    console.log('✅ Notification sent:', data.message);
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
  }
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  message: string
) => {
  try {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      console.log("🆕 Chat room doesn't exist, creating new one...");
      await createChatRoom(
        senderId,
        receiverId,
        chatId.split('_')[0] || '',
        '',
        '',
        receiverId,
        ''
      );
    }

    const messageRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messageRef, {
      senderId,
      receiverId,
      message: trimmedMessage,
      timestamp: serverTimestamp(),
      read: false,
      type: 'text',
      _offline: !navigator.onLine,
    });

    await updateDoc(chatRef, {
      lastMessage: trimmedMessage,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${receiverId}`]: increment(1),
    });

    const receiverUserChatRef = doc(db, 'userChats', receiverId, 'chats', chatId);
    await setDoc(receiverUserChatRef, {
      lastMessage: trimmedMessage,
      lastMessageTime: serverTimestamp(),
      unreadCount: increment(1),
      lastMessageSenderId: senderId,
    }, { merge: true });

    const senderUserChatRef = doc(db, 'userChats', senderId, 'chats', chatId);
    await setDoc(senderUserChatRef, {
      lastMessage: trimmedMessage,
      lastMessageTime: serverTimestamp(),
      unreadCount: 0,
      lastMessageSenderId: senderId,
    }, { merge: true });

    if (navigator.onLine) {
      const senderRef = doc(db, 'users', senderId);
      const senderSnap = await getDoc(senderRef);
      const senderData = senderSnap.exists() ? senderSnap.data() : {};
      const senderName = senderSnap.exists() 
        ? (senderData.displayName || senderData.username || senderData.shopName || 'User')
        : 'User';
      await sendPushNotification(receiverId, `💬 ${senderName}`, trimmedMessage, chatId);
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (chatId: string, userId: string) => {
  try {
    // ၁။ မဖတ်ရသေးတဲ့ messages တွေကို ရှာမယ်
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    
    // ၂။ Batch update လုပ်မယ်
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
    
    console.log(`✅ Marked ${snapshot.docs.length} messages as read in chat ${chatId}`);
    
    // ၃။ Chat document ထဲက unreadCount ကို 0 ပြန်သတ်မယ်
    await updateDoc(doc(db, 'chats', chatId), {
      [`unreadCount.${userId}`]: 0
    });
    
    // ၄။ userChats ထဲက unreadCount ကို 0 ပြန်သတ်မယ်
    await setDoc(
      doc(db, 'userChats', userId, 'chats', chatId),
      { unreadCount: 0 },
      { merge: true }
    );
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// ===== ✅ ပြင်ဆင်ထားတဲ့ listenUserChats =====
export const listenUserChats = (userId: string, callback: (chats: ChatRoom[]) => void) => {
  // ✅ userChats collection ကို နားထောင်မယ်
  const q = query(
    collection(db, 'userChats', userId, 'chats'),
    orderBy('lastMessageTime', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const chatRooms: ChatRoom[] = [];
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const chatId = docSnapshot.id;
      
      // ✅ chatId နဲ့ chats collection ကို သွားယူမယ်
      const chatRef = doc(db, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) continue;
      
      const chatData = chatSnap.data();
      const participants = chatData.participants || [];
      const productId = chatData.productId || '';
      const productTitle = chatData.productTitle || '';
      const productImage = chatData.productImage || '';
      const sellerId = chatData.sellerId || '';
      const sellerName = chatData.sellerName || '';
      
      let lastMessage = data.lastMessage || '';
      let lastMessageTime = data.lastMessageTime || null;
      const unreadCount = data.unreadCount || 0;
      const lastMessageSenderId = data.lastMessageSenderId || '';
      
      const ids = chatId.split('_');
      const otherUserId = ids.find((id) => id !== userId) || participants.find((p: string) => p !== userId);
      let otherUserName = '', otherUserPhoto = '';
      
      if (otherUserId) {
        const userSnap = await getDoc(doc(db, 'users', otherUserId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          otherUserName = userData.displayName || userData.username || userData.shopName || userData.name || userData.fullName || '';
          otherUserPhoto = userData.photoURL || userData.image || '';
        }
      }
      
      chatRooms.push({
        id: chatId,
        participants: participants.length > 0 ? participants : ids,
        lastMessage: lastMessage.trim(),
        lastMessageTime: lastMessageTime,
        unreadCount,
        productId,
        productTitle,
        productImage,
        sellerId,
        sellerName,
        lastMessageSenderId,
        otherUserName: otherUserName || sellerName || 'User',
        otherUserPhoto,
      });
    }
    
    callback(chatRooms);
  });
};

export const listenChatRoom = (chatId: string, callback: (messages: ChatMessage[]) => void) => {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        chatId,
        senderId: data.senderId || '',
        receiverId: data.receiverId || '',
        message: data.message || '',
        image: data.image || '',
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        read: data.read || false,
        type: data.type || 'text',
        orderId: data.orderId || '',
        orderData: data.orderData || null,
        _offline: data._offline || false,
      };
    });
    callback(messages);
  }, (error) => {
    console.error("🔥🔥🔥 listenChatRoom ERROR:", error);
    callback([]);
  });
};

export const listenChatRoomWithUnread = (chatId: string, userId: string, callback: (messages: ChatMessage[], unreadCount: number) => void) => {
  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
  return onSnapshot(q, async (snapshot) => {
    const messages: ChatMessage[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        chatId,
        senderId: data.senderId || '',
        receiverId: data.receiverId || '',
        message: data.message || '',
        image: data.image || '',
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
        read: data.read || false,
        type: data.type || 'text',
        orderId: data.orderId || '',
        orderData: data.orderData || null,
        _offline: data._offline || false,
      };
    });
    const chatSnap = await getDoc(doc(db, 'chats', chatId));
    const unreadCount = chatSnap.exists() ? chatSnap.data().unreadCount?.[userId] || 0 : 0;
    callback(messages, unreadCount);
  });
};