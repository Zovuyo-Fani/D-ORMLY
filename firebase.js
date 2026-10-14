import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDl6UpO586TNFhxvZepz4m-sIifxMQfRuw",
  authDomain: "dormly-ffc9a.firebaseapp.com",
  projectId: "dormly-ffc9a",
  storageBucket: "dormly-ffc9a.firebasestorage.app",
  messagingSenderId: "569171055230",
  appId: "1:569171055230:web:01a126e8cbb6d8db6c7e2f",
  measurementId: "G-3NM7ZSD8G5"
};

const app = initializeApp(firebaseConfig);

isSupported().then((supported) => {
    if (supported) {
        getAnalytics(app);
    }
});

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };