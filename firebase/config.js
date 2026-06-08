import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnYNivxRjGww5McuQK0LI1wyjIJp-RxjQ",
  authDomain: "smile-financial-solution.firebaseapp.com",
  projectId: "smile-financial-solution",
  storageBucket: "smile-financial-solution.firebasestorage.app",
  messagingSenderId: "681685112372",
  appId: "1:681685112372:web:b52f13416ed550ba3b5c61",
  measurementId: "G-3515WX2KHJ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { auth, db };
