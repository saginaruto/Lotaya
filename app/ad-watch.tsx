import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GLOBAL_WALLET, updateParticipants, checkEligibility, sendTelegramMessage, addNotification } from './(tabs)/index';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const COOLDOWN_MINUTES = 15;
const COOLDOWN_SECONDS = COOLDOWN_MINUTES * 60;
const STORAGE_KEY = 'adCooldownEndTime';

export default function AdWatchScreen() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  const [adFinished, setAdFinished] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCooldown, setIsCooldown] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 🎯 Lottery Join State
  const [isEligible, setIsEligible] = useState(false);
  const [hasJoinedLottery, setHasJoinedLottery] = useState(false);
  const [lotteryCount, setLotteryCount] = useState(0);
  const [balance, setBalance] = useState(GLOBAL_WALLET.balance);

  useEffect(() => {
    loadCooldownState();
    checkLotteryStatus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 🎯 Lottery Status Check
  const checkLotteryStatus = async () => {
    const userName = await AsyncStorage.getItem('userName') || 'User';
    const eligible = checkEligibility();
    setIsEligible(eligible);
    setHasJoinedLottery(GLOBAL_WALLET.lotteryParticipants.some(p => p.name === userName));
    setLotteryCount(GLOBAL_WALLET.lotteryParticipants.length);
    setBalance(GLOBAL_WALLET.balance);
  };

  // 🎯 Handle Join Lottery
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

            await sendTelegramMessage(
              `🎯 ${userName} has joined the Lucky Draw!\n\n👥 Total participants: ${GLOBAL_WALLET.lotteryParticipants.length}`
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

  const loadCooldownState = async () => {
    try {
      const savedEndTime = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedEndTime) {
        const endTime = parseInt(savedEndTime);
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
        if (remaining > 0) {
          setTimeLeft(remaining);
          setIsCooldown(true);
          startTimer(remaining);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.log('Error loading cooldown:', error);
    }
  };

  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsCooldown(false);
          AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startCooldown = async () => {
    try {
      const endTime = Date.now() + COOLDOWN_SECONDS * 1000;
      await AsyncStorage.setItem(STORAGE_KEY, endTime.toString());
    } catch (error) {
      console.log('Error saving cooldown:', error);
    }
    setTimeLeft(COOLDOWN_SECONDS);
    setIsCooldown(true);
    startTimer(COOLDOWN_SECONDS);
  };

  useEffect(() => {
    if (countdown > 0 && isWatching) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isWatching) {
      setAdFinished(true);
      setIsWatching(false);
      
      const rewardPoints = 10;
      setReward(rewardPoints);
      
      // ======================== GLOBAL_WALLET UPDATE ========================
      GLOBAL_WALLET.balance += rewardPoints;
      GLOBAL_WALLET.totalEarned += rewardPoints;
      GLOBAL_WALLET.activities.unshift({
        id: Date.now().toString(),
        title: '📺 Watched Video Advertisement',
        amount: `+${rewardPoints} RP`,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' Today'
      });

      // ✅ ဘောင်ဝင်ရန် စာရင်းထဲ ထည့်ခြင်း
      updateParticipants();
      setBalance(GLOBAL_WALLET.balance);

      // 🎯 ပြန်စစ်ဆေးပါ (Eligibility ပြောင်းသွားနိုင်လို့)
      const eligible = checkEligibility();
      setIsEligible(eligible);

      startCooldown();

      setTimeout(() => {
        setReward(null);
      }, 3000);
    }
  }, [countdown, isWatching]);

  const watchAd = () => {
    if (isCooldown || isWatching || adFinished) return;

    setIsWatching(true);
    setAdFinished(false);
    setCountdown(5);
    setReward(null);

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = isCooldown 
    ? ((COOLDOWN_SECONDS - timeLeft) / COOLDOWN_SECONDS) * 100 
    : 0;

  const isButtonDisabled = isCooldown || isWatching || adFinished;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch Ads</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* 🎯 Lottery Join Button - 700 RP ပြည့်မှပြမယ် */}
        {isEligible && !hasJoinedLottery ? (
          <View style={styles.lotteryJoinContainer}>
            <View style={styles.lotteryHeader}>
              <Text style={styles.lotteryIcon}>🎯</Text>
              <Text style={styles.lotteryTitle}>You are eligible!</Text>
            </View>
            <Text style={styles.lotterySub}>
              You have earned 700+ RP in 7 days. Join the Lucky Draw now!
            </Text>
            <TouchableOpacity 
              style={styles.lotteryJoinBtn}
              onPress={handleJoinLottery}
            >
              <Text style={styles.lotteryJoinBtnText}>🎯 Join Lucky Draw</Text>
              <Text style={styles.lotteryJoinSub}>Use 700 RP to join</Text>
            </TouchableOpacity>
            <Text style={styles.lotteryCount}>👥 {lotteryCount} participants so far</Text>
          </View>
        ) : hasJoinedLottery ? (
          <View style={[styles.lotteryJoinContainer, styles.joinedContainer]}>
            <View style={styles.lotteryHeader}>
              <Ionicons name="checkmark-circle" size={28} color="#059669" />
              <Text style={[styles.lotteryTitle, { color: '#059669' }]}>✅ You have joined!</Text>
            </View>
            <Text style={styles.lotterySub}>
              You are in the Lucky Draw. Good luck! 🍀
            </Text>
            <Text style={styles.lotteryCount}>👥 {lotteryCount} participants so far</Text>
          </View>
        ) : (
          <View style={[styles.lotteryJoinContainer, styles.notEligibleContainer]}>
            <View style={styles.lotteryHeader}>
              <Text style={styles.lotteryIcon}>⏳</Text>
              <Text style={[styles.lotteryTitle, { color: '#94a3b8' }]}>Need 700 RP in 7 days</Text>
            </View>
            <Text style={styles.lotterySub}>
              Keep watching ads to earn RP and become eligible for the Lucky Draw!
            </Text>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                Current Balance: <Text style={styles.progressHighlight}>{balance} RP</Text>
              </Text>
              <Text style={styles.progressText}>
                Need: <Text style={styles.progressHighlight}>700 RP</Text>
              </Text>
            </View>
          </View>
        )}

        <View style={styles.cooldownContainer}>
          {isCooldown ? (
            <>
              <Text style={styles.cooldownLabel}>⏳ Next Ad Available In</Text>
              <Text style={styles.cooldownTimer}>{formatTime(timeLeft)}</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
              </View>
            </>
          ) : (
            <View style={styles.readyContainer} />
          )}
        </View>

        <Animated.View style={[styles.videoContainer, { opacity: fadeAnim }]}>
          {!isWatching && !adFinished ? (
            <View style={styles.adPlaceholder}>
              <FontAwesome5 name="play-circle" size={60} color="#64748b" />
              <Text style={styles.adPlaceholderText}>Press "Watch Ad" to start</Text>
            </View>
          ) : isWatching ? (
            <View style={styles.adPlayingBox}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.adMainText}>📺 Video Advertisement Streaming...</Text>
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>Reward in {countdown}s</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.adPlayingBox, { backgroundColor: '#16a34a' }]}>
              <FontAwesome5 name="check-circle" size={50} color="#ffffff" />
              <Text style={styles.successTitle}>Ad Completed Successfully!</Text>
              <Text style={styles.successSub}>You have received +10 RP reward.</Text>
            </View>
          )}
        </Animated.View>

        {reward !== null && (
          <Animated.View style={styles.rewardContainer}>
            <Text style={styles.rewardText}>🎉 +{reward} RP</Text>
          </Animated.View>
        )}

        <TouchableOpacity
          onPress={watchAd}
          disabled={isButtonDisabled}
          style={[
            styles.watchButton,
            { opacity: isButtonDisabled ? 0.5 : 1 },
            isCooldown && styles.watchButtonDisabled,
            (isWatching || adFinished) && styles.watchButtonDisabled,
          ]}
        >
          <Text style={styles.watchButtonText}>
            {isWatching ? "WATCHING..." : isCooldown ? "WAIT..." : adFinished ? "✅ DONE" : "🎬 Watch Ads"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          {isCooldown 
            ? `⏳ Please wait ${formatTime(timeLeft)} before watching another ad` 
            : adFinished 
              ? "✅ Ad completed! You can close this screen."
              : "🎬 Watch a short ad to earn 10 RP points!"}
        </Text>
        <Text style={styles.cooldownInfo}>
          ⏱️ Cooldown: {COOLDOWN_MINUTES} minutes between ads
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#0f172a',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900' },

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'center',
  },

  // 🎯 Lottery Join Styles
  lotteryJoinContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  lotteryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  lotteryIcon: {
    fontSize: 24,
  },
  lotteryTitle: {
    color: '#fbbf24',
    fontSize: 18,
    fontWeight: '700',
  },
  lotterySub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  lotteryJoinBtn: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  lotteryJoinBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  lotteryJoinSub: {
    color: '#e0f2fe',
    fontSize: 12,
    marginTop: 2,
  },
  lotteryCount: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
  },
  joinedContainer: {
    borderColor: '#059669',
    backgroundColor: '#0a1f1a',
  },
  notEligibleContainer: {
    borderColor: '#475569',
    backgroundColor: '#1a1a2e',
  },
  progressInfo: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  progressHighlight: {
    color: '#fbbf24',
    fontWeight: '700',
  },

  cooldownContainer: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cooldownLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cooldownTimer: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginBottom: 10,
  },
  readyContainer: {
    height: 30,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fbbf24',
    borderRadius: 3,
  },

  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  adPlaceholder: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
  },
  adPlaceholderText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  adPlayingBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  adMainText: {
    color: '#cbd5e1',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  timerBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  successTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 15,
  },
  successSub: {
    color: '#dcfce7',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
  },

  rewardContainer: {
    backgroundColor: '#fbbf24',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  rewardText: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: 'bold',
  },

  watchButton: {
    width: '100%',
    backgroundColor: '#0a7ea4',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  watchButtonDisabled: {
    backgroundColor: '#475569',
  },
  watchButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },

  infoText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  cooldownInfo: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
});