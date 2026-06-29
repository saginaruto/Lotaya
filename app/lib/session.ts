// app/lib/session.ts
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const SESSION_KEY = 'sessionToken';

export const createSession = async (phoneNumber: string): Promise<string> => {
  const token = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    phoneNumber + Date.now().toString() + Math.random().toString()
  );
  await SecureStore.setItemAsync(SESSION_KEY, token);
  await SecureStore.setItemAsync('sessionUser', phoneNumber);
  return token;
};

export const getSession = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(SESSION_KEY);
};

export const getSessionUser = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('sessionUser');
};

export const clearSession = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(SESSION_KEY);
  await SecureStore.deleteItemAsync('sessionUser');
};

export const verifySession = async (phoneNumber: string): Promise<boolean> => {
  const session = await getSession();
  const sessionUser = await getSessionUser();
  return !!(session && sessionUser === phoneNumber);
};