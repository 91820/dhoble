import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

export const firebaseConfig = {
    apiKey: "AIzaSyAugIMJkfWOeUurqrO4pM6kzyU67UX75yE",
    authDomain: "dhobles.firebaseapp.com",
    projectId: "dhobles",
    storageBucket: "dhobles.firebasestorage.app",
    messagingSenderId: "904798271675",
    appId: "1:904798271675:web:9cefbbf4c24998adf2919e",
    measurementId: "G-TLB8ZC76J0"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
