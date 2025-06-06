  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";
  import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyB1Ic4I-4rmN9Xsc5zEB4Idu1fzAq8ANPs",
    authDomain: "dhoble-bd426.firebaseapp.com",
    projectId: "dhoble-bd426",
    storageBucket: "dhoble-bd426.firebasestorage.app",
    messagingSenderId: "613170754780",
    appId: "1:613170754780:web:8b707625dbb0d0f0f57019",
    measurementId: "G-K1VWB5KPM9"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const db = getFirestore(app);

  // Get form elements
  const form = document.querySelector('.macbook-input-wrapper');
  const passwordInput = document.querySelector('.macbook-input');
  const progressContainer = document.querySelector('.macbook-progress-bar-container');

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await validatePassword();
  });

  // Also handle Enter key press
  passwordInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await validatePassword();
    }
  });

  async function validatePassword() {
    const enteredPassword = passwordInput.value.trim();
    
    if (!enteredPassword) {
      return;
    }

    // Show progress bar
    progressContainer.hidden = false;

    try {
      // Query Firestore for valid password
      const q = query(
        collection(db, 'validAuth'), 
        where('password', '==', enteredPassword),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Password is valid, redirect to welcome page
        window.location.href = 'https://dhoble.com/welcome';
      } else {
        // Invalid password - shake the input or show error
        passwordInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          passwordInput.style.animation = '';
          passwordInput.value = '';
        }, 500);
      }
    } catch (error) {
      console.error('Error validating password:', error);
      // Handle error - could show a message or retry
      passwordInput.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        passwordInput.style.animation = '';
      }, 500);
    } finally {
      // Hide progress bar
      progressContainer.hidden = true;
    }
  }
