import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from './context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signUp, signIn, loading } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async () => {
    if (phoneNumber.length < 9) {
      Alert.alert('⚠️ Error', 'Please enter a valid phone number.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('⚠️ Error', 'Password must be at least 6 characters.');
      return;
    }
    const fullPhoneNumber = phoneNumber.startsWith('+') ? phoneNumber : `+95${phoneNumber}`;

    if (isLogin) {
      await signIn(fullPhoneNumber, password);
    } else {
      if (password !== confirmPassword) {
        Alert.alert('⚠️ Error', 'Passwords do not match.');
        return;
      }
      const success = await signUp(fullPhoneNumber, password);
      if (success) {
        setPhoneNumber('');
        setPassword('');
        setConfirmPassword('');
        setIsLogin(true);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.title}>LifeOS</Text>
          <Text style={styles.subtitle}>Your Life, Organized</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.welcomeText}>{isLogin ? 'Welcome Back!' : 'Create Account'}</Text>
          <Text style={styles.description}>
            {isLogin ? 'Enter your phone number and password to login.' : 'Create your account with phone number and password.'}
          </Text>
          <View style={styles.inputContainer}>
            <View style={styles.countryCode}><Text style={styles.countryCodeText}>+95</Text></View>
            <TextInput style={styles.input} placeholder="9xxxxxxxx" placeholderTextColor="#94a3b8" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} maxLength={10} />
          </View>
          <TextInput style={styles.passwordInput} placeholder="Enter password" placeholderTextColor="#94a3b8" secureTextEntry value={password} onChangeText={setPassword} />
          {!isLogin && <TextInput style={styles.passwordInput} placeholder="Confirm password" placeholderTextColor="#94a3b8" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setIsLogin(!isLogin); setPassword(''); setConfirmPassword(''); }} style={styles.switchButton}>
            <Text style={styles.switchButtonText}>{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}</Text>
          </TouchableOpacity>
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
  inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  countryCode: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 14, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  countryCodeText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  input: { flex: 1, backgroundColor: '#334155', color: '#ffffff', paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  passwordInput: { backgroundColor: '#334155', color: '#ffffff', paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, borderRadius: 12, marginBottom: 16 },
  submitButton: { backgroundColor: '#0a7ea4', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  switchButton: { alignItems: 'center', paddingVertical: 8 },
  switchButtonText: { color: '#0a7ea4', fontSize: 14 },
  terms: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
});