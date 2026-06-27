import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signUp: (phoneNumber: string, password: string) => Promise<boolean>;
  signIn: (phoneNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const hashPassword = async (password: string): Promise<string> => {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      const existingUser = await AsyncStorage.getItem('userData');
      if (existingUser) {
        const parsed = JSON.parse(existingUser);
        if (parsed.phoneNumber === phoneNumber) {
          Alert.alert('⚠️ Error', 'This phone number is already registered.');
          return false;
        }
      }

      const hashedPassword = await hashPassword(password);
      const userData = {
        phoneNumber,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      Alert.alert('✅ Success', 'Account created successfully! Please login.');
      return true;
    } catch (error: any) {
      console.log('Sign up error:', error);
      Alert.alert('❌ Error', error.message || 'Failed to create account.');
      return false;
    }
  };

  const signIn = async (phoneNumber: string, password: string): Promise<boolean> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('❌ Error', 'No account found. Please sign up first.');
        return false;
      }

      const parsed = JSON.parse(userData);
      const hashedInput = await hashPassword(password);

      if (parsed.phoneNumber !== phoneNumber) {
        Alert.alert('❌ Error', 'Phone number not found.');
        return false;
      }

      if (parsed.password !== hashedInput) {
        Alert.alert('❌ Error', 'Incorrect password.');
        return false;
      }

      parsed.lastLogin = new Date().toISOString();
      await AsyncStorage.setItem('userData', JSON.stringify(parsed));
      setUser(parsed);
      Alert.alert('✅ Success', 'Welcome back!');
      return true;
    } catch (error: any) {
      console.log('Sign in error:', error);
      Alert.alert('❌ Error', error.message || 'Login failed.');
      return false;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      Alert.alert('✅ Logged Out', 'You have been logged out.');
    } catch (error: any) {
      console.log('Logout error:', error);
      Alert.alert('❌ Error', 'Failed to log out.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default export ထည့်ပါ
export default AuthProvider;