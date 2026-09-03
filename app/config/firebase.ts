// app/config/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  reload
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCUMfFf9t9Ev3Tc9E-89vYF8SDhkfuND9k",
  authDomain: "lifeos-1a0af.firebaseapp.com",
  projectId: "lifeos-1a0af",
  storageBucket: "lifeos-1a0af.firebasestorage.app",
  messagingSenderId: "189466565186",
  appId: "1:189466565186:web:d6144a7cb28251a097ebdb",
  measurementId: "G-L965KJB5EC"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { 
  auth,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  reload
};