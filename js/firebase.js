  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

  import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyC4L5btNiwvcCKDXEQaa1EQc1qwA0koa9I",
    authDomain: "learnhub-68057.firebaseapp.com",
    projectId: "learnhub-68057",
    storageBucket: "learnhub-68057.firebasestorage.app",
    messagingSenderId: "599605107763",
    appId: "1:599605107763:web:a3ce26a9e9078fbc58d746"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
