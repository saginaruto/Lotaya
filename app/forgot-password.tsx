// app/forgot-password.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { auth, sendPasswordResetEmail } from './config/firebase';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      Alert.alert(
        '✅ Email Sent', 
        'Password reset link has been sent to your email.\n\nPlease check your inbox and follow the instructions.'
      );
    } catch (error: any) {
      let message = 'Failed to send reset email.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      Alert.alert('❌ Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🔑 Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        {sent ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>📧 Reset link sent!</Text>
            <Text style={styles.successSubtext}>
              Please check your email and follow the instructions to reset your password.
            </Text>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.push('/login')}
            >
              <Text style={styles.backButtonText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity 
              style={styles.resetButton} 
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backLink}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.backLinkText}>← Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#6b7280',
    fontSize: 14,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
});