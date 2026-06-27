import AsyncStorage from '@react-native-async-storage/async-storage';
import { LotteryParticipant, Notification, Wallet, UserProfile, Activity } from '../types';

// ==================== WALLET ====================
const WALLET_KEY = 'walletData';

export const getWallet = async (): Promise<Wallet> => {
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

export const saveWallet = async (wallet: Wallet): Promise<void> => {
  try {
    await AsyncStorage.setItem(WALLET_KEY, JSON.stringify(wallet));
  } catch (error) {
    console.log('Error saving wallet:', error);
  }
};

// ==================== NOTIFICATIONS ====================
const NOTIFICATIONS_KEY = 'notifications';

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.log('Error getting notifications:', error);
    return [];
  }
};

export const saveNotifications = async (notifications: Notification[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.log('Error saving notifications:', error);
  }
};

export const markAllAsRead = async (): Promise<void> => {
  try {
    const notifications = await getNotifications();
    notifications.forEach(n => n.read = true);
    await saveNotifications(notifications);
  } catch (error) {
    console.log('Error marking all as read:', error);
  }
};

export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    await saveNotifications(filtered);
  } catch (error) {
    console.log('Error deleting notification:', error);
  }
};

// ==================== USER PROFILE ====================
const PROFILE_KEY = 'userProfile';
const USERNAME_KEY = 'userName';

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const data = await AsyncStorage.getItem(PROFILE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.log('Error getting user profile:', error);
    return null;
  }
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.log('Error saving user profile:', error);
  }
};

export const saveUserName = async (name: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USERNAME_KEY, name);
  } catch (error) {
    console.log('Error saving username:', error);
  }
};

// ==================== LOTTERY PARTICIPANTS ====================
const LOTTERY_KEY = 'lotteryParticipants';

export const getLotteryParticipants = async (): Promise<LotteryParticipant[]> => {
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

// Export all functions as default
export default {
  getWallet,
  saveWallet,
  getNotifications,
  saveNotifications,
  markAllAsRead,
  deleteNotification,
  getUserProfile,
  saveUserProfile,
  saveUserName,
  getLotteryParticipants
};