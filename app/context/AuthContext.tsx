// app/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  reload
} from '../config/firebase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await reload(firebaseUser);
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ==================== SIGN UP ====================
  const signUp = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      setUser(null);
      Alert.alert('✅ Check Your Email', 'Verification email sent! You can also login without verifying for now.');
      return true;
    } catch (error: any) {
      let message = 'Failed to create account.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      }
      Alert.alert('❌ Error', message);
      return false;
    }
  };

  // ==================== SIGN IN ====================
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await reload(userCredential.user);
      
      // ✅ Verify စစ်တာကို ခဏပိတ်ထားပါ
      // if (!userCredential.user.emailVerified) {
      //   await signOut(auth);
      //   setUser(null);
      //   Alert.alert('⚠️ Email Not Verified', 'Please verify your email first.');
      //   return false;
      // }
      
      setUser(userCredential.user);
      Alert.alert('✅ Success', 'Welcome back!');
      return true;
    } catch (error: any) {
      let message = 'Login failed.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found. Please sign up first.';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Try again later.';
      }
      Alert.alert('❌ Error', message);
      return false;
    }
  };

  // ==================== RESEND VERIFICATION ====================
  const resendVerification = async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert('✅ Resent', 'Verification email resent.');
      } else {
        Alert.alert('Error', 'No user found. Please sign up first.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend.');
    }
  };

  // ==================== LOGOUT ====================
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      Alert.alert('✅ Logged Out', 'You have been logged out.');
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to logout.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logout, resendVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};