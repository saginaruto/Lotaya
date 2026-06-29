// app/lib/crypto.ts
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Salt ထုတ်ယူခြင်း (သို့) အသစ်ဖန်တီးခြင်း
const getSalt = async (phoneNumber: string): Promise<string> => {
  const saltKey = `salt_${phoneNumber}`;
  let salt = await SecureStore.getItemAsync(saltKey);
  if (!salt) {
    salt = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      phoneNumber + Date.now().toString()
    );
    await SecureStore.setItemAsync(saltKey, salt);
  }
  return salt;
};

// Password + Salt ကို Hash လုပ်ပါ
export const hashPasswordWithSalt = async (password: string, phoneNumber: string): Promise<string> => {
  const salt = await getSalt(phoneNumber);
  const combined = password + salt;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
};

// Password စစ်ဆေးခြင်း
export const verifyPassword = async (inputPassword: string, storedHash: string, phoneNumber: string): Promise<boolean> => {
  const hash = await hashPasswordWithSalt(inputPassword, phoneNumber);
  return hash === storedHash;
};