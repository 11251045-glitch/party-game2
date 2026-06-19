import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase Configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyBB5QZq1lr27ULHh9Qbk_KJMDvUpglYrFs",
  authDomain: "bingo-83c8a.firebaseapp.com",
  databaseURL: "https://bingo-83c8a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bingo-83c8a",
  storageBucket: "bingo-83c8a.firebasestorage.app",
  messagingSenderId: "154760297789",
  appId: "1:154760297789:web:3180da999dd1ea40b01954",
  measurementId: "G-EE21MQDPMR"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
