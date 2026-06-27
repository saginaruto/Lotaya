import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, ImageBackground, Animated, PanResponder, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWallet, saveWallet } from '../lib/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 40; 
const WIDGET_SIZE = 70;

// ======================== GLOBAL WALLET ========================
export let GLOBAL_WALLET = {
  balance: 0,
  totalEarned: 0,
  activities: [] as Array<{ id: string; title: string; amount: string; date: string }>,
  participants: [] as Array<{
    id: string;
    name: string;
    joinedAt: string;
    isEligible: boolean;
  }>,
  winners: [] as Array<{
    id: string;
    name: string;
    username?: string;
    date: string;
    points: number;
  }>,
  lotteryParticipants: [] as Array<{
    id: string;
    name: string;
    joinedAt: string;
  }>,
};

// ======================== LAST SENT STATUS ========================
export let LAST_SENT_SUNDAY = {
  date: '',
  sent: false,
};

// ======================== TELEGRAM CONFIG ========================
const TELEGRAM_BOT_TOKEN = '8674179748:AAE1Fj3rtbKzu_BvcXRVHPTdOnyumoDKcfM';
const TELEGRAM_CHANNEL_ID = '@super_sunday';

// ======================== SEND TELEGRAM MESSAGE ========================
export const sendTelegramMessage = async (message: string) => {
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );
    const data = await response.json();
    if (!data.ok) {
      console.log('Telegram error:', data.description);
    } else {
      console.log('✅ Telegram message sent successfully!');
    }
  } catch (error) {
    console.log('Error sending to Telegram:', error);
  }
};

// ======================== NOTIFICATION SYSTEM ========================
export const addNotification = async (title: string, message: string) => {
  try {
    const saved = await AsyncStorage.getItem('notifications');
    let notifications = saved ? JSON.parse(saved) : [];
    notifications.unshift({
      id: Date.now().toString(),
      title: title,
      message: message,
      date: new Date().toLocaleDateString(),
      read: false,
    });
    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.log('Error adding notification:', error);
  }
};

export const getUnreadCount = async () => {
  try {
    const saved = await AsyncStorage.getItem('notifications');
    if (saved) {
      const notifications = JSON.parse(saved);
      return notifications.filter((n: any) => !n.read).length;
    }
    return 0;
  } catch (error) {
    return 0;
  }
};

// ======================== LEVEL SYSTEM ========================
const LEVELS = [
  { level: 1, minPoints: 0, maxPoints: 100, title: 'Bronze', icon: '🥉' },
  { level: 2, minPoints: 101, maxPoints: 300, title: 'Silver', icon: '🥈' },
  { level: 3, minPoints: 301, maxPoints: 600, title: 'Gold', icon: '🥇' },
  { level: 4, minPoints: 601, maxPoints: 1000, title: 'Platinum', icon: '💎' },
  { level: 5, minPoints: 1001, maxPoints: 2000, title: 'Diamond', icon: '👑' },
  { level: 6, minPoints: 2001, maxPoints: Infinity, title: 'Legend', icon: '🌟' },
];

const getLevel = (points: number) => {
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints && points < LEVELS[i].maxPoints) {
      return LEVELS[i];
    }
    if (points >= LEVELS[LEVELS.length - 1].minPoints) {
      return LEVELS[LEVELS.length - 1];
    }
  }
  return LEVELS[0];
};

// ======================== ELIGIBILITY CHECK ========================
const getPointsInLast7Days = () => {
  return 700;
};

export const checkEligibility = () => {
  const totalPoints = getPointsInLast7Days();
  return totalPoints >= 700;
};

export const updateParticipants = async () => {
  const isEligible = checkEligibility();
  
  let userName = 'User';
  let userId = '';
  try {
    const profile = await AsyncStorage.getItem('userProfile');
    if (profile) {
      const data = JSON.parse(profile);
      userName = data.name || 'User';
      userId = data.id || Date.now().toString();
    }
  } catch (error) {
    console.log('Error loading profile:', error);
  }
  
  await AsyncStorage.setItem('userName', userName);
  
  const existingIndex = GLOBAL_WALLET.participants.findIndex(p => p.name === userName);
  
  if (existingIndex >= 0) {
    GLOBAL_WALLET.participants[existingIndex].isEligible = isEligible;
  } else {
    GLOBAL_WALLET.participants.push({
      id: userId,
      name: userName,
      joinedAt: new Date().toLocaleDateString(),
      isEligible: isEligible,
    });
  }
  
  if (GLOBAL_WALLET.participants.length > 1) {
    const latestUser = GLOBAL_WALLET.participants[GLOBAL_WALLET.participants.length - 1];
    GLOBAL_WALLET.participants = [latestUser];
  }
};

// ======================== SEND LOTTERY LIST TO TELEGRAM ========================
export const sendLotteryListToTelegram = async () => {
  const participants = GLOBAL_WALLET.lotteryParticipants;
  
  if (participants.length === 0) {
    await sendTelegramMessage(
      `📋 <b>Lottery Participants List - Sunday Draw</b>\n\n` +
      `❌ No participants yet for this week's draw.`
    );
    return;
  }

  const message = 
    `🎯 <b>LOTTERY PARTICIPANTS LIST</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📅 Date: ${new Date().toLocaleDateString()}\n` +
    `👥 Total: <b>${participants.length}</b> participants\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    participants.map((p, i) => 
      `${i + 1}. <b>${p.name}</b> (Joined: ${p.joinedAt})`
    ).join('\n') +
    `\n\n━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🍀 Good luck to all participants!`;
  
  await sendTelegramMessage(message);
  
  await addNotification(
    '📋 Lottery List Sent!',
    `Total ${participants.length} participants have been announced on Telegram.`
  );
};

// ======================== CHECK AND SEND SUNDAY LIST ========================
const checkAndSendLotteryList = async () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const today = now.toDateString();
  
  if (day === 0 && hour === 15 && minute === 0) {
    try {
      const saved = await AsyncStorage.getItem('lastSentSunday');
      let lastSent = { date: '', sent: false };
      if (saved) {
        lastSent = JSON.parse(saved);
      }
      
      if (lastSent.date !== today || !lastSent.sent) {
        console.log('📤 Sending lottery list to Telegram...');
        await sendLotteryListToTelegram();
        
        await AsyncStorage.setItem('lastSentSunday', JSON.stringify({
          date: today,
          sent: true,
        }));
        
        LAST_SENT_SUNDAY.date = today;
        LAST_SENT_SUNDAY.sent = true;
        
        console.log('✅ Lottery list sent successfully!');
      } else {
        console.log('⏳ Already sent for today:', today);
      }
    } catch (error) {
      console.log('Error in checkAndSendLotteryList:', error);
    }
  }
};

// ======================== MAIN COMPONENT ========================
export default function HomeScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(GLOBAL_WALLET.balance);
  const [userName, setUserName] = useState('User');
  const [currentLevel, setCurrentLevel] = useState(LEVELS[0]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [isEligible, setIsEligible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasJoinedLottery, setHasJoinedLottery] = useState(false);
  const [lotteryCount, setLotteryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      refreshAllData();
      loadUnreadCount();
      checkLotteryStatus();
    }, [])
  );

  const checkLotteryStatus = async () => {
    const userName = await AsyncStorage.getItem('userName') || 'User';
    const hasJoined = GLOBAL_WALLET.lotteryParticipants.some(p => p.name === userName);
    setHasJoinedLottery(hasJoined);
    setLotteryCount(GLOBAL_WALLET.lotteryParticipants.length);
  };

  const loadUnreadCount = async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  };

  const handleJoinLottery = async () => {
    if (GLOBAL_WALLET.balance < 700) {
      Alert.alert('Insufficient Points', 'You need at least 700 RP to join the lottery.');
      return;
    }

    Alert.alert(
      'Join Lucky Draw',
      `You will use 700 RP to join the lottery.\n\nCurrent Balance: ${GLOBAL_WALLET.balance} RP`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join Now',
          onPress: async () => {
            GLOBAL_WALLET.balance -= 700;
            GLOBAL_WALLET.activities.unshift({
              id: Date.now().toString(),
              title: '🎯 Joined Lucky Draw',
              amount: '-700 RP',
              date: new Date().toLocaleDateString(),
            });

            // AsyncStorage ကိုလည်း update လုပ်ပါ
            const currentWallet = await getWallet();
            currentWallet.balance = GLOBAL_WALLET.balance;
            currentWallet.activities = GLOBAL_WALLET.activities;
            await saveWallet(currentWallet);

            const userName = await AsyncStorage.getItem('userName') || 'User';
            GLOBAL_WALLET.lotteryParticipants.push({
              id: Date.now().toString(),
              name: userName,
              joinedAt: new Date().toLocaleDateString(),
            });

            await addNotification(
              '🎯 Joined Lucky Draw!',
              `${userName} has joined the Lucky Draw.`
            );

            setHasJoinedLottery(true);
            setLotteryCount(GLOBAL_WALLET.lotteryParticipants.length);
            setBalance(GLOBAL_WALLET.balance);
            
            Alert.alert('✅ Success!', 'You have joined the Lucky Draw!');
          }
        }
      ]
    );
  };

  const refreshAllData = async () => {
    // AsyncStorage ကနေ ပြန်ဖတ်ပါ
    const savedWallet = await getWallet();
    
    // GLOBAL_WALLET ကို update လုပ်ပါ
    GLOBAL_WALLET.balance = savedWallet.balance;
    GLOBAL_WALLET.totalEarned = savedWallet.totalEarned;
    GLOBAL_WALLET.activities = savedWallet.activities;
    
    setBalance(GLOBAL_WALLET.balance);

    let earned = 0;
    GLOBAL_WALLET.activities.forEach((act) => {
      const amount = parseInt(act.amount);
      if (!isNaN(amount) && amount > 0) {
        earned += amount;
      }
    });
    GLOBAL_WALLET.totalEarned = earned;
    setTotalEarned(earned);

    const level = getLevel(earned);
    setCurrentLevel(level);
    await AsyncStorage.setItem('userLevel', String(level.level));

    try {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) {
        const data = JSON.parse(profile);
        setUserName(data.name || 'User');
        await AsyncStorage.setItem('userName', data.name || 'User');
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }

    const eligible = checkEligibility();
    setIsEligible(eligible);
    await updateParticipants();
  };

  useEffect(() => {
    refreshAllData();
    loadUnreadCount();
    checkLotteryStatus();

    const checkInterval = setInterval(() => {
      checkAndSendLotteryList();
    }, 60000);

    return () => clearInterval(checkInterval);
  }, []);

  const educationAds = [
    { 
      id: 'edu1', 
      name: 'Strategy First University', 
      city: 'Yangon', 
      discount: '10% Off', 
      bgImage: 'https://images.unsplash.com/photo-1541339907198-e08756defefe?q=80&w=600&auto=format&fit=crop',
      address: 'No.45, Pyay Road, Kamayut Township, Yangon',
      phone: '09-123456789'
    },
    { 
      id: 'edu2', 
      name: 'Wall Street English', 
      city: 'Mandalay', 
      discount: '15% Off', 
      bgImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop',
      address: '73rd Street, Between 26th & 27th Street, Mandalay',
      phone: '09-987654321'
    },
  ];

  const healthAds = [
    { 
      id: 'heal1', 
      name: 'Pun Hlaing Hospital', 
      city: 'Yangon', 
      discount: '20% Off', 
      bgImage: 'https://images.unsplash.com/photo-1586773860418-d3b978b8c657?q=80&w=600&auto=format&fit=crop',
      address: 'Pun Hlaing Golf Estate Avenue, Hlaing Tharyar Township, Yangon',
      phone: '09-444555666'
    },
    { 
      id: 'heal2', 
      name: 'Grand Hantha International', 
      city: 'Yangon', 
      discount: '12% Off', 
      bgImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=600&auto=format&fit=crop',
      address: 'Corner of Pyay Road and Nar Nat Taw Street, Kamayut, Yangon',
      phone: '09-777888999'
    },
  ];

  const [eduIndex, setEduIndex] = useState(0);
  const [healthIndex, setHealthIndex] = useState(0);
  const eduScrollRef = useRef<ScrollView>(null);
  const healthScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextEdu = (eduIndex + 1) % educationAds.length;
      setEduIndex(nextEdu);
      eduScrollRef.current?.scrollTo({ x: nextEdu * CAROUSEL_WIDTH, animated: true });

      const nextHealth = (healthIndex + 1) % healthAds.length;
      setHealthIndex(nextHealth);
      healthScrollRef.current?.scrollTo({ x: nextHealth * CAROUSEL_WIDTH, animated: true });
    }, 8000);
    return () => clearInterval(timer);
  }, [eduIndex, healthIndex]);

  const adPan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 90, y: SCREEN_HEIGHT - 280 })).current;

  const checkCollision = (pos1: {x: number, y: number}, pos2: {x: number, y: number}) => {
    const size = WIDGET_SIZE;
    return !(pos1.x + size < pos2.x || pos2.x + size < pos1.x || pos1.y + size < pos2.y || pos2.y + size < pos1.y);
  };

  const adPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        adPan.setOffset({ x: (adPan.x as any)._value, y: (adPan.y as any)._value });
        adPan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (e, gesture) => {
        adPan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: () => { adPan.flattenOffset(); },
    })
  ).current;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Level {currentLevel.level} {currentLevel.icon}</Text>
          </View>          
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push("/notification")} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#111827" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.rpBadge}>
            <FontAwesome5 name="coins" size={15} color="#0284c7" />
            <Text style={styles.rpText}>{balance} RP</Text>
          </View>
        </View>
      </View>

      <View style={styles.adsContainer}>
        <View style={styles.bannerSection}>
          <View style={styles.titleWrapper}>
            <Text style={styles.sectionIcon}>🎓</Text>
            <Text style={styles.sectionTitle}>Education Partners</Text>
          </View>
          <ScrollView ref={eduScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={false} style={{ width: CAROUSEL_WIDTH }}>
            {educationAds.map((ad) => (
              <TouchableOpacity key={ad.id} activeOpacity={0.9} style={{ width: CAROUSEL_WIDTH }} onPress={() => router.push({ pathname: "/partner-detail", params: { id: ad.id, name: ad.name, city: ad.city, discount: ad.discount, bgImage: ad.bgImage, address: ad.address, phone: ad.phone } })}>
                <ImageBackground source={{ uri: ad.bgImage }} style={styles.imageBg} imageStyle={{ borderRadius: 20 }}>
                  <View style={[styles.overlay, { backgroundColor: 'rgba(15, 23, 42, 0.75)' }]} />
                  <Text style={styles.adCity}>{ad.city}</Text>
                  <Text style={styles.adName}>{ad.name}</Text>
                  <Text style={styles.adDiscount}>✨ Up to {ad.discount}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bannerSection}>
          <View style={styles.titleWrapper}>
            <Text style={styles.sectionIcon}>🏥</Text>
            <Text style={styles.sectionTitle}>Health Partners</Text>
          </View>
          <ScrollView ref={healthScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEnabled={false} style={{ width: CAROUSEL_WIDTH }}>
            {healthAds.map((ad) => (
              <TouchableOpacity key={ad.id} activeOpacity={0.9} style={{ width: CAROUSEL_WIDTH }} onPress={() => router.push({ pathname: "/partner-detail", params: { id: ad.id, name: ad.name, city: ad.city, discount: ad.discount, bgImage: ad.bgImage, address: ad.address, phone: ad.phone } })}>
                <ImageBackground source={{ uri: ad.bgImage }} style={styles.imageBg} imageStyle={{ borderRadius: 20 }}>
                  <View style={[styles.overlay, { backgroundColor: 'rgba(6, 78, 59, 0.75)' }]} />
                  <Text style={styles.adCity}>{ad.city}</Text>
                  <Text style={styles.adName}>{ad.name}</Text>
                  <Text style={styles.adDiscount}>✨ Up to {ad.discount}</Text>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      
      <Animated.View {...adPanResponder.panHandlers} style={[styles.floatingWidget, { transform: [{ translateX: adPan.x }, { translateY: adPan.y }] }]}>
        <TouchableOpacity onPress={() => router.push("/ad-watch")} activeOpacity={0.85} style={[styles.circleButton, { backgroundColor: '#0284c7' }]}>
          <MaterialCommunityIcons name="play-circle" size={26} color="#fff" />
          <Text style={styles.buttonText}>Watch</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#ffffff',
    marginTop: 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  levelBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '700',
  },
  notificationBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  rpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  rpText: {
    color: '#0369a1',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },
  adsContainer: { 
    flex: 1, 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    justifyContent: 'space-evenly' 
  },
  bannerSection: { 
    flex: 1, 
    marginVertical: 10, 
    justifyContent: 'center' 
  },
  titleWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    paddingLeft: 4 
  },
  sectionIcon: { 
    fontSize: 24, 
    marginRight: 8 
  },
  sectionTitle: { 
    color: '#111827', 
    fontWeight: '900', 
    fontSize: 19, 
    letterSpacing: -0.3 
  },
  imageBg: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    minHeight: 160 
  },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    borderRadius: 20 
  },
  adCity: { 
    color: '#cbd5e1', 
    fontSize: 11, 
    fontWeight: '600', 
    letterSpacing: 1 
  },
  adName: { 
    color: '#ffffff', 
    fontSize: 22, 
    fontWeight: '900', 
    marginTop: 4 
  },
  adDiscount: { 
    color: '#fbbf24', 
    fontSize: 16, 
    fontWeight: '900', 
    marginTop: 8 
  },
  floatingWidget: { 
    position: 'absolute', 
    zIndex: 999 
  },
  circleButton: { 
    width: WIDGET_SIZE, 
    height: WIDGET_SIZE, 
    borderRadius: WIDGET_SIZE/2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 4, 
    borderColor: '#ffffff', 
    elevation: 8 
  },
  buttonText: { 
    color: '#ffffff', 
    fontSize: 9, 
    fontWeight: 'bold', 
    marginTop: 1, 
    textTransform: 'uppercase' 
  },
});