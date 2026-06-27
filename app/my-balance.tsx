import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types ကို တိုက်ရိုက်သတ်မှတ်ပါ
interface Activity {
  id: string;
  title: string;
  amount: string;
  date: string;
}

interface Wallet {
  balance: number;
  totalEarned: number;
  activities: Activity[];
}

// Storage function ကို တိုက်ရိုက်ရေးပါ
const WALLET_KEY = 'walletData';

const getWallet = async (): Promise<Wallet> => {
  try {
    const data = await AsyncStorage.getItem(WALLET_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return { balance: 0, totalEarned: 0, activities: [] };
  } catch (error) {
    console.log('Error getting wallet:', error);
    return { balance: 0, totalEarned: 0, activities: [] };
  }
};

export default function MyBalanceScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet>({ balance: 0, totalEarned: 0, activities: [] });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => { 
    const data = await getWallet(); 
    setWallet(data); 
  };
  
  useEffect(() => { loadData(); }, []);
  
  const onRefresh = async () => { 
    setRefreshing(true); 
    await loadData(); 
    setRefreshing(false); 
  };

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} 
      contentContainerStyle={styles.content}
    >
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceAmount}>{wallet.balance} RP</Text>
        <View style={styles.balanceDivider} />
        <View style={styles.balanceStats}>
          <View style={styles.balanceStat}>
            <Text style={styles.statValue}>{wallet.totalEarned}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.balanceStatDivider} />
          <View style={styles.balanceStat}>
            <Text style={styles.statValue}>{wallet.activities.length}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/ad-watch')}>
          <View style={[styles.quickIcon, { backgroundColor: '#dbeafe' }]}>
            <FontAwesome5 name="play" size={20} color="#0284c7" />
          </View>
          <Text style={styles.quickLabel}>Watch Ad</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/lucky-draw')}>
          <View style={[styles.quickIcon, { backgroundColor: '#fef3c7' }]}>
            <FontAwesome5 name="spinner" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.quickLabel}>Lucky Draw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/transaction-history')}>
          <View style={[styles.quickIcon, { backgroundColor: '#d1fae5' }]}>
            <Ionicons name="list" size={20} color="#059669" />
          </View>
          <Text style={styles.quickLabel}>History</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {wallet.activities.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="clock" size={32} color="#d1d5db" />
            <Text style={styles.emptyText}>No activities yet</Text>
          </View>
        ) : (
          wallet.activities.slice(0, 5).map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityLeft}>
                <Text style={styles.activityEmoji}>
                  {activity.title.includes('🎯') ? '🎯' : 
                   activity.title.includes('📺') ? '📺' : 
                   activity.title.includes('🎉') ? '🎉' : '📌'}
                </Text>
                <View>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                </View>
              </View>
              <Text style={[styles.activityAmount, { color: activity.amount.startsWith('-') ? '#ef4444' : '#22c55e' }]}>
                {activity.amount}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  balanceCard: { 
    backgroundColor: '#1e293b', 
    borderRadius: 20, 
    padding: 24, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8 
  },
  balanceLabel: { 
    color: '#94a3b8', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  balanceAmount: { 
    color: '#ffffff', 
    fontSize: 40, 
    fontWeight: '900', 
    marginTop: 4 
  },
  balanceDivider: { 
    height: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    marginVertical: 16 
  },
  balanceStats: { 
    flexDirection: 'row' 
  },
  balanceStat: { 
    flex: 1, 
    alignItems: 'center' 
  },
  balanceStatDivider: { 
    width: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  statValue: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  statLabel: { 
    color: '#94a3b8', 
    fontSize: 12, 
    marginTop: 2 
  },
  quickActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 20 
  },
  quickAction: { 
    alignItems: 'center' 
  },
  quickIcon: { 
    width: 52, 
    height: 52, 
    borderRadius: 26, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  quickLabel: { 
    color: '#111827', 
    fontSize: 12, 
    fontWeight: '500', 
    marginTop: 4 
  },
  activitiesSection: { 
    marginTop: 24 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827', 
    marginBottom: 12 
  },
  activityItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  activityLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  activityEmoji: { 
    fontSize: 18 
  },
  activityTitle: { 
    color: '#111827', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  activityDate: { 
    color: '#9ca3af', 
    fontSize: 12 
  },
  activityAmount: { 
    fontSize: 14, 
    fontWeight: '600' 
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 30 
  },
  emptyText: { 
    color: '#6b7280', 
    fontSize: 14, 
    marginTop: 8 
  },
});