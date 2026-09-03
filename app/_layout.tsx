// app/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './login';  // ← ဒီနေရာမှာ ./login ဖြစ်ဖို့လိုတယ်
import { View, ActivityIndicator } from 'react-native';

function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ad-watch" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="my-balance" options={{ headerShown: false }} />
      <Stack.Screen name="notification" options={{ headerShown: false }} />
      <Stack.Screen name="partner-detail" options={{ headerShown: false }} />
      <Stack.Screen name="transaction-history" options={{ headerShown: false }} />
      <Stack.Screen name="lottery-participants" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <RootLayout />
    </AuthProvider>
  );
}