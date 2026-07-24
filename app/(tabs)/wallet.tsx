// အားလုံးကို ဒီအတိုင်း ပြင်ပါ

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getWallet } from '../lib/storage';

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

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet>({ balance: 0, totalEarned: 0, activities: [] });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await getWallet();
    setWallet(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>💰 Total Balance</Text>
            <TouchableOpacity onPress={() => router.push('/transaction-history')}>
              <Text style={styles.historyLink}>History →</Text>
            </TouchableOpacity>
          </View>
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
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
          </View>
        </View>

        <View style={styles.activitiesSection}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {wallet.activities.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="clock" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>No activities yet</Text>
              <Text style={styles.emptySubtext}>Start earning by watching ads!</Text>
            </View>
          ) : (
            wallet.activities.slice(0, 10).map((activity) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb',
  },
  content: { 
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  
  balanceCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  historyLink: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
    marginTop: 4,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  balanceStats: {
    flexDirection: 'row',
  },
  balanceStat: {
    flex: 1,
    alignItems: 'center',
  },
  balanceStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },

  activitiesSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  activityDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
});