import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types ကို တိုက်ရိုက်သတ်မှတ်ပါ
interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

// Storage functions ကို တိုက်ရိုက်ရေးပါ
const NOTIFICATIONS_KEY = 'notifications';

const getNotifications = async (): Promise<Notification[]> => {
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

const saveNotifications = async (notifications: Notification[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.log('Error saving notifications:', error);
  }
};

const markAllAsRead = async (): Promise<void> => {
  try {
    const notifications = await getNotifications();
    notifications.forEach(n => n.read = true);
    await saveNotifications(notifications);
  } catch (error) {
    console.log('Error marking all as read:', error);
  }
};

const deleteNotification = async (id: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    await saveNotifications(filtered);
  } catch (error) {
    console.log('Error deleting notification:', error);
  }
};

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { loadNotifications(); }, []));

  const loadNotifications = async () => { 
    const data = await getNotifications(); 
    setNotifications(data); 
  };
  
  const onRefresh = async () => { 
    setRefreshing(true); 
    await loadNotifications(); 
    setRefreshing(false); 
  };
  
  const handleMarkAllRead = async () => { 
    await markAllAsRead(); 
    await loadNotifications(); 
  };
  
  const handleDelete = async (id: string) => { 
    await deleteNotification(id); 
    await loadNotifications(); 
  };
  
  const handleDeleteAll = async () => { 
    await saveNotifications([]); 
    await loadNotifications(); 
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.headerBtnText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleDeleteAll}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.list} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} 
        contentContainerStyle={styles.listContent} 
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View key={notification.id} style={[styles.notificationItem, !notification.read && styles.unreadItem]}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationDate}>{notification.date}</Text>
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(notification.id)}>
                <Ionicons name="close" size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#f3f4f6' 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#111827' 
  },
  headerActions: { 
    flexDirection: 'row', 
    gap: 12, 
    alignItems: 'center' 
  },
  headerBtnText: { 
    color: '#0284c7', 
    fontSize: 13, 
    fontWeight: '500' 
  },
  list: { flex: 1 },
  listContent: { 
    padding: 16, 
    paddingBottom: 30 
  },
  notificationItem: { 
    backgroundColor: '#ffffff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: '#f3f4f6', 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  unreadItem: { 
    borderColor: '#0284c7', 
    borderWidth: 2, 
    backgroundColor: '#f0f9ff' 
  },
  notificationContent: { flex: 1 },
  notificationTitle: { 
    color: '#111827', 
    fontSize: 15, 
    fontWeight: '600' 
  },
  notificationMessage: { 
    color: '#4b5563', 
    fontSize: 14, 
    marginTop: 2 
  },
  notificationDate: { 
    color: '#9ca3af', 
    fontSize: 12, 
    marginTop: 4 
  },
  deleteBtn: { 
    padding: 6 
  },
  emptyState: { 
    alignItems: 'center', 
    paddingVertical: 80 
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