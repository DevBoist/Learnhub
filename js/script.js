import { auth } from "./firebase.js";

// console.log("Firebase project:", auth.app.options.projectId);
import {
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore();

const userColRef = collection(db, "users");

const authCard = document.getElementById("auth-card");
const showLoginButton = document.getElementById("show-login");

showLoginButton.addEventListener("click", () => {
  authCard.classList.add("is-login");
});

const showRegisterButton = document.getElementById("show-register");
showRegisterButton.addEventListener("click", () => {
  authCard.classList.remove("is-login");
});

const registerForm = document.getElementById("register-form");

const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const registerRoleSelect = document.getElementById("register-role");

const registerMessage = document.getElementById("register-message");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  registerMessage.textContent = "";

  const loginEmailInput = document.getElementById("login-email");
  const loginPasswordInput = document.getElementById("login-password");
  const loginMessage = document.getElementById("login-message");

  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const email = registerEmailInput.value.trim();
  const password = registerPasswordInput.value;
  const role = registerRoleSelect.value;

  if (!firstName || !lastName || !email || !password || !role) {
    registerMessage.textContent = "Please fill in all required fields.";
    registerMessage.style.color = "red";
    registerMessage.style.fontWeight = "bold";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/;

  if (!emailRegex.test(email)) {
    registerMessage.textContent = "Please enter a valid email address.";
    registerMessage.style.color = "red";
    registerMessage.style.fontWeight = "bold";
    return;
  }

  if (!passwordRegex.test(password)) {
    registerMessage.textContent =
      "Your password must contain at least 8 characters, including a letter and a number";
    registerMessage.style.color = "red";
    registerMessage.style.fontWeight = "bold";
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const userDocSnapShot = await addDoc(userColRef, {
      uid: userCredential.user.uid,
      firstname: firstName,
      lastname: lastName,
      email: email,
      role: role,
    });

    const signedOut = await signOut(auth);

    registerForm.reset();

    loginEmailInput.value = email;
    loginPasswordInput.value = "";

    loginMessage.textContent = "Account created successfully. Please log in.";
    loginMessage.style.color = "green";
    loginMessage.style.fontWeight = "bold";

    authCard.classList.add("is-login");

    registerMessage.textContent = "Account created successfully!";
    registerMessage.style.color = "green";
    registerMessage.style.fontWeight = "bold";
  } catch (error) {
     if(error.message === "Firebase: Error (auth/email-already-in-use)."){
            registerMessage.textContent = "Email already exist, kindly use a different email";
        }
    
    registerMessage.style.color = "red";
    registerMessage.style.fontWeight = "bold";
  }


  
});
