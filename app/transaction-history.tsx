import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
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

type FilterType = 'all' | 'earn' | 'spend' | 'reward';

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

export default function TransactionHistoryScreen() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => { 
    const wallet = await getWallet(); 
    setActivities(wallet.activities || []); 
  };
  
  useEffect(() => { loadData(); }, []);
  
  const onRefresh = async () => { 
    setRefreshing(true); 
    await loadData(); 
    setRefreshing(false); 
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;
    if (filter === 'earn') return activities.filter(a => !a.amount.startsWith('-'));
    if (filter === 'spend') return activities.filter(a => a.amount.startsWith('-'));
    if (filter === 'reward') return activities.filter(a => a.title.includes('🎉') || a.title.includes('⭐'));
    return activities;
  };

  const getActivityIcon = (title: string) => {
    if (title.includes('🎯')) return '🎯';
    if (title.includes('📺')) return '📺';
    if (title.includes('🎉')) return '🎉';
    if (title.includes('⭐')) return '⭐';
    if (title.includes('💰')) return '💰';
    return '📌';
  };

  const getActivityColor = (amount: string) => amount.startsWith('-') ? '#ef4444' : '#22c55e';

  const filtered = getFilteredActivities();

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['all', 'earn', 'spend', 'reward'] as FilterType[]).map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterTab, filter === f && styles.filterTabActive]} 
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'earn' ? '💰 Earn' : f === 'spend' ? '💸 Spend' : '🎁 Reward'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.list} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} 
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="clock" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptySubtext}>Start earning by watching ads!</Text>
          </View>
        ) : (
          filtered.map((activity, index) => (
            <View key={activity.id || index} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: getActivityColor(activity.amount) + '20' }]}>
                  <Text style={styles.transactionEmoji}>{getActivityIcon(activity.title)}</Text>
                </View>
                <View>
                  <Text style={styles.transactionTitle}>{activity.title}</Text>
                  <Text style={styles.transactionDate}>{activity.date}</Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, { color: getActivityColor(activity.amount) }]}>
                {activity.amount}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  filterContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6', 
    gap: 8 
  },
  filterTab: { 
    paddingHorizontal: 16, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: '#f3f4f6' 
  },
  filterTabActive: { 
    backgroundColor: '#0284c7' 
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '500', 
    color: '#6b7280' 
  },
  filterTextActive: { 
    color: '#ffffff' 
  },
  list: { flex: 1 },
  listContent: { 
    padding: 16, 
    paddingBottom: 30 
  },
  transactionItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#f3f4f6' 
  },
  transactionLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  transactionIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  transactionEmoji: { 
    fontSize: 18 
  },
  transactionTitle: { 
    color: '#111827', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  transactionDate: { 
    color: '#9ca3af', 
    fontSize: 12, 
    marginTop: 1 
  },
  transactionAmount: { 
    fontSize: 15, 
    fontWeight: '600' 
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 60 
  },
  emptyTitle: { 
    color: '#111827', 
    fontSize: 18, 
    fontWeight: '600', 
    marginTop: 12 
  },
  emptySubtext: { 
    color: '#6b7280', 
    fontSize: 14, 
    marginTop: 4 
  },
});