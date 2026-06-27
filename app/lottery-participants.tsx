import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types ကို တိုက်ရိုက်သတ်မှတ်ပါ
interface LotteryParticipant {
  id: string;
  name: string;
  joinedAt: string;
  isEligible: boolean;
}

// Storage function ကို တိုက်ရိုက်ရေးပါ
const LOTTERY_KEY = 'lotteryParticipants';

const getLotteryParticipants = async (): Promise<LotteryParticipant[]> => {
  try {
    const data = await AsyncStorage.getItem(LOTTERY_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.log('Error getting lottery participants:', error);
    return [];
  }
};

export default function LotteryParticipantsScreen() {
  const [participants, setParticipants] = useState<LotteryParticipant[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => { 
    const data = await getLotteryParticipants(); 
    setParticipants(data); 
  };
  
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
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Lottery Participants</Text>
        <Text style={styles.headerCount}>Total: {participants.length}</Text>
      </View>

      {participants.length === 0 ? (
        <View style={styles.emptyState}>
          <FontAwesome5 name="users" size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Participants</Text>
          <Text style={styles.emptySubtext}>Be the first to join the lottery!</Text>
        </View>
      ) : (
        participants.map((p, index) => (
          <View key={p.id} style={styles.participantItem}>
            <View style={styles.participantRank}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>
            <View style={styles.participantInfo}>
              <Text style={styles.participantName}>{p.name}</Text>
              <Text style={styles.participantDate}>Joined: {p.joinedAt}</Text>
            </View>
            {p.isEligible && (
              <View style={styles.eligibleBadge}>
                <Text style={styles.eligibleText}>✅</Text>
              </View>
            )}
          </View>
        ))
      )}

      {participants.length > 0 && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>🍀 Good luck to all {participants.length} participants!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, paddingBottom: 40 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827' 
  },
  headerCount: { 
    color: '#6b7280', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  participantItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    padding: 14, 
    borderRadius: 12, 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#f3f4f6' 
  },
  participantRank: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#f3f4f6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  rankNumber: { 
    color: '#6b7280', 
    fontSize: 12, 
    fontWeight: '700' 
  },
  participantInfo: { flex: 1 },
  participantName: { 
    color: '#111827', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  participantDate: { 
    color: '#9ca3af', 
    fontSize: 12, 
    marginTop: 1 
  },
  eligibleBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4 
  },
  eligibleText: { fontSize: 14 },
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
  footer: { 
    marginTop: 20, 
    padding: 16, 
    backgroundColor: '#1e293b', 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  footerText: { 
    color: '#fbbf24', 
    fontSize: 14, 
    fontWeight: '500' 
  },
});