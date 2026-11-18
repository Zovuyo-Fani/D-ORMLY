import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAfld1Z7mWoWXS0H7OWkAJALBHHeRh488",
  authDomain: "d-ormly.firebaseapp.com",
  projectId: "d-ormly",
  storageBucket: "d-ormly.firebasestorage.app",
  messagingSenderId: "961509718482",
  appId: "1:961509718482:web:ee84b0cbebb7d34618b00b",
  measurementId: "G-RD8HGY2XWZ"
};

const app = initializeApp(firebaseConfig);

// Analytics is loaded separately and in the background. If it is blocked
// (ad-blockers) or slow, it can no longer stop the whole site from loading.
import("https://www.gstatic.com/firebasejs/12.16.0/firebase-analytics.js")
  .then(({ getAnalytics, isSupported }) =>
    isSupported().then((ok) => { if (ok) getAnalytics(app); }))
  .catch(() => {});

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
