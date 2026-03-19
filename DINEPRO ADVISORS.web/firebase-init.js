
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, push, onValue, set, update, remove } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Firebase configuration from 69 Studio (reused database)
const firebaseConfig = {
    apiKey: "AIzaSyDp7G3C1mMeK1Htfsxharb05wtf0VTw88",
    authDomain: "studio-7cdf1.firebaseapp.com",
    databaseURL: "https://studio-7cdf1-default-rtdb.firebaseio.com",
    projectId: "studio-7cdf1",
    storageBucket: "studio-7cdf1.firebasestorage.app",
    messagingSenderId: "460661592780",
    appId: "1:460661592780:web:dc8fd00cad5541141e6869",
    measurementId: "G-Q8YJHFC1H1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Expose to window for global access
window.firebaseDB = database;
window.firebaseRef = ref;
window.firebasePush = push;
window.firebaseOnValue = onValue;
window.firebaseSet = set;
window.firebaseUpdate = update;
window.firebaseRemove = remove;

// Notify that firebase is ready
window.dispatchEvent(new Event('firebaseLoaded'));
console.log("Firebase Global Sync Initialized");
