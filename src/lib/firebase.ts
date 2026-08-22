import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBKt_-ZVEU-ueMWqcGayZO2IheIfvzfSRg",
  authDomain: "sobatguru-id.firebaseapp.com",
  projectId: "sobatguru-id",
  storageBucket: "sobatguru-id.firebasestorage.app",
  messagingSenderId: "262222032849",
  appId: "1:262222032849:web:6417319c2b236690853af0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);
