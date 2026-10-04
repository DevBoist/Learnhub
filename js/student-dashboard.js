import { auth } from "./firebase.js";

import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore();
const userColRef = collection(db, "users");

const profileName = document.getElementById("profile-name");
const profileRole = document.getElementById("user-role");
const profileEmail = document.getElementById("profile-email");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./index.html");
    return;
  }

  try {
    const userProfilesQuery = query(
      userColRef,
      where("uid", "==", user.uid),
    );

    const userProfilesSnapshot = await getDocs(userProfilesQuery);

    if (userProfilesSnapshot.empty) {
      await signOut(auth);
      window.location.replace("./index.html");
      return;
    }

    const userProfile = userProfilesSnapshot.docs[0].data();

    if (userProfile.role !== "student") {
      if (userProfile.role === "instructor") {
        window.location.replace("./instructor-dashboard.html");
      } else {
        await signOut(auth);
        window.location.replace("./index.html");
      }
      return;
    }

    profileName.textContent =
      `${userProfile.firstname} ${userProfile.lastname}`.trim();
    profileRole.textContent = "Student";
    profileEmail.textContent = userProfile.email || user.email;
  } catch (error) {
    profileName.textContent = "Profile unavailable";
    profileEmail.textContent = "Could not load your account details.";
    console.error("Student profile error:", error.code || error.message);
  }
});
