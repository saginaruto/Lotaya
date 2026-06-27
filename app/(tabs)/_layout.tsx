import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, BackHandler, View, ActivityIndicator, Text } from 'react-native';
import * as Network from 'expo-network';

export default function TabLayout() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsConnected(state.isConnected ?? true);
      } catch (error) {
        console.log('Network check error:', error);
        setIsConnected(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkNetwork();

    const interval = setInterval(async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const connected = state.isConnected ?? false;
        setIsConnected(connected);

        if (!connected) {
          Alert.alert(
            '⚠️ No Internet Connection',
            'Please check your internet connection and try again.',
            [
              { 
                text: 'Retry', 
                onPress: () => {
                  Network.getNetworkStateAsync().then((state) => {
                    setIsConnected(state.isConnected ?? false);
                  });
                }
              },
              { 
                text: 'Exit', 
                onPress: () => BackHandler.exitApp(),
                style: 'destructive'
              }
            ],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.log('Network check error:', error);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <FontAwesome5 name="wifi" size={60} color="#64748b" />
        <Text style={{ color: '#94a3b8', fontSize: 18, marginTop: 20, fontWeight: '600' }}>
          No Internet Connection
        </Text>
        <Text style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
          Please check your network settings
        </Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="partners"
        options={{
          title: 'Partners',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="handshake" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="wallet" size={size - 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}