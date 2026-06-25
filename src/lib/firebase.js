import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Cấu hình Firebase của ứng dụng vietfuhreschein
const firebaseConfig = {
  apiKey: "AIzaSyDrEDfBoouS1QP5B2drEO2ZSfGq7yeW4Ic",
  authDomain: "vietfuhreschein.firebaseapp.com",
  projectId: "vietfuhreschein",
  storageBucket: "vietfuhreschein.firebasestorage.app",
  messagingSenderId: "119449967025",
  appId: "1:119449967025:web:47474a657efb89dc9fc590",
  measurementId: "G-ESYVM93BGG"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Các Provider đăng nhập
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Hàm tiện ích đăng nhập bằng Popup
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
export const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const verifyEmail = (user) => sendEmailVerification(user);
export const updateUserProfile = (user, data) => updateProfile(user, data);
