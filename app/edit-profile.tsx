// app/edit-profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// Types
interface UserProfile {
  id: string;
  name: string;
  bio: string;
  phone: string;
  email: string;
  avatar?: string;
  joinedAt: string;
}

// Storage functions
const PROFILE_KEY = 'userProfile';
const USERNAME_KEY = 'userName';

const getUserProfile = async (): Promise<UserProfile | null> => {
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

const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.log('Error saving user profile:', error);
  }
};

const saveUserName = async (name: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USERNAME_KEY, name);
  } catch (error) {
    console.log('Error saving username:', error);
  }
};

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ 
    id: '', 
    name: '', 
    bio: '', 
    phone: '', 
    email: '', 
    joinedAt: new Date().toISOString() 
  });

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const data = await getUserProfile();
    if (data) setProfile(data);
    else setProfile({ 
      id: Date.now().toString(), 
      name: 'User', 
      bio: 'Hi there! I am using Lotaya 🎯', 
      phone: '', 
      email: '', 
      joinedAt: new Date().toISOString() 
    });
  };

  const handleSave = async () => {
    if (!profile.name.trim()) { 
      Alert.alert('Error', 'Please enter your name.'); 
      return; 
    }
    setLoading(true);
    try {
      await saveUserProfile(profile);
      await saveUserName(profile.name);
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) { 
      Alert.alert('Error', 'Failed to save profile.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { 
      Alert.alert('Permission required', 'Please grant permission to access photos.'); 
      return; 
    }
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsEditing: true, 
      aspect: [1, 1], 
      quality: 0.8 
    });
    if (!result.canceled) setProfile({ ...profile, avatar: result.assets[0].uri });
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar - Avatar ကိုထိမှသာ ပွင့်မယ် */}
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          {profile.avatar ? 
            <Image source={{ uri: profile.avatar }} style={styles.avatar} /> : 
            <View style={styles.avatarPlaceholder}>
              <FontAwesome5 name="user" size={40} color="#94a3b8" />
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color="#ffffff" />
              </View>
            </View>
          }
          <Text style={styles.avatarLabel}>Tap to change photo</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput 
              style={styles.input} 
              value={profile.name} 
              onChangeText={(text) => setProfile({ ...profile, name: text })} 
              placeholder="Enter your name" 
              placeholderTextColor="#94a3b8" 
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput 
              style={[styles.input, styles.textArea]} 
              value={profile.bio} 
              onChangeText={(text) => setProfile({ ...profile, bio: text })} 
              placeholder="Tell us about yourself" 
              placeholderTextColor="#94a3b8" 
              multiline 
              numberOfLines={3} 
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <TextInput 
              style={styles.input} 
              value={profile.phone} 
              onChangeText={(text) => setProfile({ ...profile, phone: text })} 
              placeholder="Enter your phone number" 
              placeholderTextColor="#94a3b8" 
              keyboardType="phone-pad" 
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              value={profile.email} 
              onChangeText={(text) => setProfile({ ...profile, email: text })} 
              placeholder="Enter your email" 
              placeholderTextColor="#94a3b8" 
              keyboardType="email-address" 
              autoCapitalize="none" 
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
        </TouchableOpacity>
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
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 24,
    marginTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  avatarContainer: { 
    alignItems: 'center', 
    marginBottom: 24,
    marginTop: 0,
    padding: 10,  // ← ဒါကိုထည့်ပါ
  },
  avatar: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 3, 
    borderColor: '#0284c7' 
  },
  avatarPlaceholder: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#e5e7eb', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#0284c7', 
    position: 'relative' 
  },
  avatarEditBadge: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    backgroundColor: '#0284c7', 
    borderRadius: 12, 
    padding: 6 
  },
  avatarLabel: { 
    color: '#6b7280', 
    fontSize: 12, 
    marginTop: 8 
  },
  form: { 
    gap: 16 
  },
  inputGroup: { 
    gap: 6 
  },
  label: { 
    color: '#111827', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  input: { 
    backgroundColor: '#ffffff', 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 10, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: '#111827' 
  },
  textArea: { 
    minHeight: 80, 
    textAlignVertical: 'top' 
  },
  saveButton: { 
    backgroundColor: '#0284c7', 
    borderRadius: 12, 
    paddingVertical: 16, 
    alignItems: 'center', 
    marginTop: 24 
  },
  saveButtonText: { 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});