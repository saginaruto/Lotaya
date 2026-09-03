// app/types/index.ts

export interface LotteryParticipant {
  id: string;
  name: string;
  joinedAt: string;
  isEligible: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface Activity {
  id: string;
  title: string;
  amount: string;
  date: string;
}

export interface Wallet {
  balance: number;
  totalEarned: number;
  activities: Activity[];
  participants?: LotteryParticipant[];
  lotteryParticipants?: LotteryParticipant[];
  winners?: any[];
}

export interface UserProfile {
  id: string;
  name: string;
  bio: string;
  phone: string;
  email: string;
  avatar?: string;
  joinedAt: string;
}

// ❌ ဒီ default export ကို ဖယ်လိုက်ပါ
// export default {
//   LotteryParticipant,
//   Notification,
//   Activity,
//   Wallet,
//   UserProfile
// };