import { auth } from "./firebase.js";
import { getUserProfile } from "./user-profile.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const db = getFirestore();

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
const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("login-email");
const loginPasswordInput = document.getElementById("login-password");
const loginMessage = document.getElementById("login-message");

const registerButton = document.getElementById("register-button");
const loginButton = document.getElementById("login-button");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (registerButton.disabled || loginButton.disabled) {
    return;
  }
  registerMessage.textContent = "";

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

  registerButton.disabled = true;
  loginButton.disabled = true;
  registerButton.textContent = "Creating account...";

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      firstname: firstName,
      lastname: lastName,
      email: email,
      role: role,
    });

    registerButton.textContent = "Creating account.....";

    await signOut(auth);

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
    if (error.code === "auth/email-already-in-use") {
      registerMessage.textContent =
        "This email is already registered. Please log in.";
    } else {
      registerMessage.textContent = "Account setup could not be completed.";
    }

    registerMessage.style.color = "red";
    console.error("Registration error:", error.code);
  } finally {
    registerButton.disabled = false;
    loginButton.disabled = false;

    registerButton.textContent = "Create account";
    loginButton.textContent = "Log in";
  }
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (registerButton.disabled || loginButton.disabled) {
    return;
  }

  loginMessage.textContent = "";
  loginMessage.style.color = "red";
  loginMessage.style.fontWeight = "bold";

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    loginMessage.textContent = "Please enter your email and password.";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

  if (!emailRegex.test(email)) {
    loginMessage.textContent = "Please enter a valid email address.";
    return;
  }

  registerButton.disabled = true;
  loginButton.disabled = true;
  loginButton.textContent = "Logging in...";
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );

    const userProfile = await getUserProfile(userCredential.user);

    if (!userProfile) {
      loginMessage.textContent =
        "Your account profile could not be found. Please contact support.";
      await signOut(auth);
      return;
    }

    if (userProfile.role === "student") {
      window.location.href = "./student-dashboard.html";
    } else if (userProfile.role === "instructor") {
      window.location.href = "./instructor-dashboard.html";
    } else {
      loginMessage.textContent = "Your account has an unrecognised role.";
      await signOut(auth);
    }
  } catch (error) {
    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      loginMessage.textContent = "Incorrect email or password.";
    } else if (error.code === "auth/network-request-failed") {
      loginMessage.textContent =
        "Could not connect. Check your internet connection.";
    } else if (error.code === "auth/too-many-requests") {
      loginMessage.textContent = "Too many attempts. Please try again later.";
    } else {
      loginMessage.textContent = "Unable to log in. Please try again.";
    }

    console.error("Login error:", error.code);
  } finally {
    registerButton.disabled = false;
    loginButton.disabled = false;

    registerButton.textContent = "Create account";
    loginButton.textContent = "Log in";
  }
});
