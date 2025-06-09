console.log('Script loaded');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1Ic4I-4rmN9Xsc5zEB4Idu1fzAq8ANPs",
  authDomain: "dhoble-bd426.firebaseapp.com",
  projectId: "dhoble-bd426",
  storageBucket: "dhoble-bd426.firebasestorage.app",
  messagingSenderId: "613170754780",
  appId: "1:613170754780:web:8b707625dbb0d0f0f57019",
  measurementId: "G-K1VWB5KPM9"
};

console.log('About to initialize Firebase');

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('Firebase initialized');

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  
  // Get form elements
  const form = document.querySelector('.macbook-input-wrapper');
  const passwordInput = document.querySelector('.macbook-input');
  const progressContainer = document.querySelector('.macbook-progress-bar-container');

  console.log('Form:', form);
  console.log('Password input:', passwordInput);
  console.log('Progress container:', progressContainer);

  // Handle form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      console.log('Form submitted');
      e.preventDefault();
      await validatePassword();
    });
  }

  // Also handle Enter key press
  if (passwordInput) {
    passwordInput.addEventListener('keypress', async (e) => {
      console.log('Key pressed:', e.key);
      if (e.key === 'Enter') {
        console.log('Enter key detected');
        e.preventDefault();
        await validatePassword();
      }
    });
  }

  async function validatePassword() {
    console.log('validatePassword called');
    const enteredPassword = passwordInput.value.trim();
    console.log('Password entered:', enteredPassword);
    
    if (!enteredPassword) {
      console.log('No password entered');
      return;
    }

    // Show progress bar
    if (progressContainer) {
      progressContainer.hidden = false;
      console.log('Progress bar shown');
    }

    try {
      console.log('Querying Firestore...');
      // Query Firestore for valid password
      const querySnapshot = await db.collection('validAuth')
        .where('password', '==', enteredPassword)
        .where('active', '==', true)
        .get();

      console.log('Query completed. Empty?', querySnapshot.empty);

      if (!querySnapshot.empty) {
        console.log('Password valid, redirecting...');
        // Password is valid, redirect to welcome page
        window.location.href = 'https://dhoble.com/welcome';
      } else {
        console.log('Invalid password, shaking input');
        // Invalid password - shake the input or show error
        passwordInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          passwordInput.style.animation = '';
          passwordInput.value = '';
        }, 500);
      }
    } catch (error) {
      console.error('Error validating password:', error);
      passwordInput.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        passwordInput.style.animation = '';
      }, 500);
    } finally {
      // Hide progress bar
      if (progressContainer) {
        progressContainer.hidden = true;
        console.log('Progress bar hidden');
      }
    }
  }
});
