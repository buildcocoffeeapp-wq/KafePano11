// Firebase Configuration
// KafePano - Dijital Pano Sistemi

const firebaseConfig = {
  apiKey: "AIzaSyA9qjI_9h9NFC5H720TaMKhm626Q5rNdVg",
  authDomain: "buildcocoffee-ac2ce.firebaseapp.com",
  databaseURL: "https://buildcocoffee-ac2ce-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "buildcocoffee-ac2ce",
  storageBucket: "buildcocoffee-ac2ce.firebasestorage.app",
  messagingSenderId: "15157617502",
  appId: "1:15157617502:web:c65da2c9a6aba4ba47a5cf"
};

// Cloudinary Configuration
const cloudinaryConfig = {
  cloudName: "dvs23rcjh",
  uploadPreset: "kafepano"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references
const auth = firebase.auth();
const database = firebase.database();

// Export for use in other files
window.firebaseConfig = firebaseConfig;
window.cloudinaryConfig = cloudinaryConfig;
window.auth = auth;
window.database = database;
