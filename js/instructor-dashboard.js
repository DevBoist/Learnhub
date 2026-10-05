import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore();
const userColRef = collection(db, "users");

const logoutButton = document.getElementById("logout-button");
const profileName = document.getElementById("profile-name");
const profileRole = document.getElementById("user-role");
const profileEmail = document.getElementById("profile-email");

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "./index.html";
  } catch (error) {
    console.error("Logout error:", error.code);
  }
});

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

    if (userProfile.role !== "instructor") {
      if (userProfile.role === "student") {
        window.location.replace("./student-dashboard.html");
      } else {
        await signOut(auth);
        window.location.replace("./index.html");
      }
      return;
    }

    profileName.textContent =
      `${userProfile.firstname} ${userProfile.lastname}`.trim();
    profileRole.textContent = "Instructor";
    profileEmail.textContent = userProfile.email || user.email;
  } catch (error) {
    profileName.textContent = "Profile unavailable";
    profileEmail.textContent = "Could not load your account details.";
    console.error("Instructor profile error:", error.code || error.message);
  }
});

const createCourseForm = document.getElementById("create-course-form");
const courseTitleInput = document.getElementById("course-title");
const courseCodeInput = document.getElementById("course-code");
const courseDescriptionInput = document.getElementById("course-description");
const courseMessage = document.getElementById("course-message");

createCourseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = courseTitleInput.value.trim();
  const code = courseCodeInput.value.trim();
  const description = courseDescriptionInput.value.trim();

  courseMessage.textContent = "";

if (!title || !code || !description) {
  courseMessage.textContent = "Please fill in all course fields.";
  courseMessage.style.color = "red";
  return;
}
const courseColRef = collection(db, "courses");

const currentUser = auth.currentUser;

if (!currentUser) {
  courseMessage.textContent = "Please log in to create a course.";
  courseMessage.style.color = "red";
  return;
}

try {
  await addDoc(courseColRef, {
    title,
    code,
    description,
    instructorId: currentUser.uid,
  });

  courseMessage.textContent = "Course created successfully.";
  courseMessage.style.color = "green";
  createCourseForm.reset();
} catch (error) {
  courseMessage.textContent = "Could not create the course. Please try again.";
  courseMessage.style.color = "red";
  console.error("Course creation error:", error.code || error.message);
}

});
