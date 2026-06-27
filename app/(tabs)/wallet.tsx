// app/(tabs)/wallet.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function WalletScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💰 Wallet</Text>
      <Text style={styles.subtitle}>Your balance and transactions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#f9fafb' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#111827' 
  },
  subtitle: { 
    fontSize: 14, 
    color: '#6b7280', 
    marginTop: 8 
  },
});