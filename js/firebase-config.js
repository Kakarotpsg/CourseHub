// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// TODO: Replace this with your app's Firebase project configuration
// The user noted they will provide the realtime database URL shortly.
const firebaseConfig = {
    apiKey: "AIzaSyAbSk8j5SdIoetboKKDHrr14wxKme0S0wk",
    authDomain: "coursehub-2a0a4.firebaseapp.com",
    databaseURL: "https://coursehub-2a0a4-default-rtdb.firebaseio.com",
    projectId: "coursehub-2a0a4",
    storageBucket: "coursehub-2a0a4.firebasestorage.app",
    messagingSenderId: "3844243806",
    appId: "1:3844243806:web:64ee96b8dcdacc80734fcf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);
