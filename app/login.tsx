// app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from './context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const { signUp, signIn, loading, resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  // ==================== PASSWORD VALIDATION ====================
  const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*).' };
    }
    return { valid: true, message: 'Password is strong!' };
  };

  // ==================== PASSWORD REQUIREMENTS DISPLAY ====================
  const getPasswordRequirements = () => {
    const checks = [
      { label: 'At least 8 characters', test: password.length >= 8 },
      { label: 'At least one uppercase letter (A-Z)', test: /[A-Z]/.test(password) },
      { label: 'At least one lowercase letter (a-z)', test: /[a-z]/.test(password) },
      { label: 'At least one number (0-9)', test: /[0-9]/.test(password) },
      { label: 'At least one special character (!@#$%^&*)', test: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
    return checks;
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('⚠️ Error', 'Please enter your email.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('⚠️ Error', 'Please enter your password.');
      return;
    }

    if (isLogin) {
      const success = await signIn(email, password);
      if (success) {
        router.replace('/(tabs)');
      }
    } else {
      // Sign Up - Validate password
      const validation = validatePassword(password);
      if (!validation.valid) {
        Alert.alert('⚠️ Weak Password', validation.message);
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('⚠️ Error', 'Passwords do not match.');
        return;
      }
      const success = await signUp(email, password);
      if (success) {
        setShowVerificationMessage(true);
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification();
    } catch (error) {
      Alert.alert('Error', 'Please sign up first to resend verification email.');
    }
  };

  const passwordRequirements = !isLogin ? getPasswordRequirements() : [];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.title}>Lotaya</Text>
          <Text style={styles.subtitle}>Your Rewards App</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>
          <Text style={styles.description}>
            {isLogin ? 'Enter your email and password to login.' : 'Create your account with a strong password.'}
          </Text>
          
          {/* Email Input */}
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor="#94a3b8" 
            keyboardType="email-address" 
            autoCapitalize="none"
            value={email} 
            onChangeText={setEmail} 
          />
          
          {/* Password Input with Show/Hide */}
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Password" 
              placeholderTextColor="#94a3b8" 
              secureTextEntry={!showPassword}
              value={password} 
              onChangeText={setPassword} 
            />
            <TouchableOpacity 
              style={styles.eyeButton} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Confirm Password (Sign Up only) */}
          {!isLogin && (
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput} 
                placeholder="Confirm Password" 
                placeholderTextColor="#94a3b8" 
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
              />
              <TouchableOpacity 
                style={styles.eyeButton} 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesome5 name={showConfirmPassword ? "eye" : "eye-slash"} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
          )}

          {/* Password Requirements (Sign Up only) */}
          {!isLogin && password.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>🔒 Password Requirements:</Text>
              {passwordRequirements.map((req, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Text style={[styles.requirementText, req.test && styles.requirementMet]}>
                    {req.test ? '✅' : '❌'} {req.label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ✅ Verification Message - Sign Up ပြီးရင် ပြမယ် */}
          {!isLogin && showVerificationMessage && (
            <View style={styles.verificationContainer}>
              <Text style={styles.verificationTitle}>📧 Check Your Email</Text>
              <Text style={styles.verificationText}>
                We've sent a verification link to {email}
              </Text>
              <Text style={styles.verificationSub}>
                ⚠️ Please verify your email to complete sign up
              </Text>
            </View>
          )}

          {isLogin && (
            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); setShowVerificationMessage(false); }} style={styles.switchButton}>
            <Text style={styles.switchButtonText}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}</Text>
          </TouchableOpacity>

          {/* ✅ Resend Verification Button - Login mode မှာပဲပြမယ် */}
          {isLogin && (
            <TouchableOpacity onPress={handleResendVerification} style={styles.resendButton}>
              <Text style={styles.resendButtonText}>📧 Resend Verification Email</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.terms}>By continuing, you agree to our Terms of Service and Privacy Policy.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  emoji: { fontSize: 60, marginBottom: 12 },
  title: { color: '#ffffff', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: '#94a3b8', fontSize: 16, marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#334155' },
  welcomeText: { color: '#ffffff', fontSize: 24, fontWeight: '700', textAlign: 'center' },
  description: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  
  input: { 
    backgroundColor: '#334155', 
    color: '#ffffff', 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    fontSize: 16, 
    borderRadius: 12, 
    marginBottom: 16 
  },
  
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: { 
    flex: 1,
    color: '#ffffff', 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  forgotPasswordText: {
    color: '#0a7ea4',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 16,
  },

  requirementsContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  requirementsTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  requirementItem: {
    paddingVertical: 2,
  },
  requirementText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  requirementMet: {
    color: '#4ade80',
  },

  verificationContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  verificationTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  verificationText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  verificationSub: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '500',
  },

  submitButton: { backgroundColor: '#0a7ea4', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  switchButton: { alignItems: 'center', paddingVertical: 8 },
  switchButtonText: { color: '#0a7ea4', fontSize: 14 },
  
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  resendButtonText: {
    color: '#6b7280',
    fontSize: 13,
  },

  terms: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});