import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();

  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmEnabled, setBgmEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [appVersion, setAppVersion] = useState('1.0.0');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSfx = await AsyncStorage.getItem('sfxEnabled');
      if (savedSfx !== null) setSfxEnabled(JSON.parse(savedSfx));
      
      const savedBgm = await AsyncStorage.getItem('bgmEnabled');
      if (savedBgm !== null) setBgmEnabled(JSON.parse(savedBgm));
      
      const savedNotifications = await AsyncStorage.getItem('notificationsEnabled');
      if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log('Error saving setting:', error);
    }
  };

  const handleToggleSfx = (value: boolean) => {
    setSfxEnabled(value);
    saveSetting('sfxEnabled', value);
  };

  const handleToggleBgm = (value: boolean) => {
    setBgmEnabled(value);
    saveSetting('bgmEnabled', value);
  };

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    saveSetting('notificationsEnabled', value);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
          }
        }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    rightElement, 
    onPress 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string; 
    rightElement?: React.ReactNode; 
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement && <View style={styles.settingRight}>{rightElement}</View>}
      {onPress && <Ionicons name="chevron-forward" size={18} color="#9BA1A6" />}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ၁။ အကောင့်နှင့် ပရိုဖိုင် */}
        <SectionHeader title="Account & Profile" />
        <View style={styles.section}>
          <SettingItem
            icon={<FontAwesome5 name="user-circle" size={20} color="#0a7ea4" />}
            title="Profile"
            subtitle="Name, Avatar, Bio"
            onPress={() => router.push("/edit-profile")}
          />
        </View>

        {/* ၂။ ဂိမ်းနှင့် Ads ထိန်းချုပ်မှု */}
        <SectionHeader title="Game & Reward Settings" />
        <View style={styles.section}>
          <SettingItem
            icon={<Ionicons name="volume-high" size={20} color="#8b5cf6" />}
            title="Sound Effects"
            subtitle={sfxEnabled ? "On" : "Off"}
            rightElement={
              <Switch
                value={sfxEnabled}
                onValueChange={handleToggleSfx}
                trackColor={{ false: '#334155', true: '#0a7ea4' }}
                thumbColor={sfxEnabled ? '#ffffff' : '#94a3b8'}
              />
            }
          />
          <SettingItem
            icon={<Ionicons name="musical-notes" size={20} color="#ec4899" />}
            title="Background Music"
            subtitle={bgmEnabled ? "On" : "Off"}
            rightElement={
              <Switch
                value={bgmEnabled}
                onValueChange={handleToggleBgm}
                trackColor={{ false: '#334155', true: '#0a7ea4' }}
                thumbColor={bgmEnabled ? '#ffffff' : '#94a3b8'}
              />
            }
          />
          <SettingItem
            icon={<Ionicons name="notifications" size={20} color="#06b6d4" />}
            title="Push Notifications"
            subtitle={notificationsEnabled ? "On" : "Off"}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#334155', true: '#0a7ea4' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#94a3b8'}
              />
            }
          />
        </View>

        {/* ၃။ အကူအညီနှင့် ထောက်ပံ့မှု */}
        <SectionHeader title="Support & Help" />
        <View style={styles.section}>
          <SettingItem
            icon={<Ionicons name="help-circle" size={20} color="#22d3ee" />}
            title="FAQ"
            subtitle="Frequently asked questions"
          />
          <SettingItem
            icon={<Ionicons name="mail" size={20} color="#f472b6" />}
            title="Contact Us"
            subtitle="Email, Telegram, Messenger"
          />
          <SettingItem
            icon={<Ionicons name="information-circle" size={20} color="#34d399" />}
            title="About"
            subtitle={`Version ${appVersion}`}
            onPress={() => {
              Alert.alert(
                'About Lotaya',
                `Version: ${appVersion}\n\nLotaya is a fun and rewarding app where you can earn RP points by watching ads and playing Lucky Draw.`,
                [{ text: 'OK' }]
              );
            }}
          />
        </View>

        {/* ၄။ ဥပဒေနှင့် လုံခြုံရေး */}
        <SectionHeader title="Legal & Privacy" />
        <View style={styles.section}>
          <SettingItem
            icon={<Ionicons name="document-text" size={20} color="#fb923c" />}
            title="Privacy Policy"
          />
          <SettingItem
            icon={<Ionicons name="document-text" size={20} color="#fb923c" />}
            title="Terms of Service"
          />
          <SettingItem
            icon={<Ionicons name="trash" size={20} color="#ef4444" />}
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>LifeOS v{appVersion}</Text>
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
  sectionHeader: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  settingIcon: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 1,
  },
  settingRight: {
    marginRight: 8,
  },
  footer: {
    marginTop: 30,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 13,
  },
});