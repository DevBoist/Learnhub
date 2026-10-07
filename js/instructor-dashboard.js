import { auth } from "./firebase.js";
import { loadInstructorAssignments } from "./instructor-assignments.js";
import { setupAssignmentForm } from "./create-assignment.js";
import { getUserProfile } from "./user-profile.js";
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
const courseColRef = collection(db, "courses");
const instructorCourseList = document.getElementById("instructor-course-list");
const assignmentCourseSelect = document.getElementById("assignment-course");

async function loadInstructorCourses(instructorId) {
  instructorCourseList.textContent = "Loading your courses...";
  const selectedCourseId = assignmentCourseSelect.value;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Loading your courses...";
  placeholder.disabled = true;
  placeholder.selected = true;
  assignmentCourseSelect.replaceChildren(placeholder);
  assignmentCourseSelect.disabled = true;

  try {
    const instructorCoursesQuery = query(
      courseColRef,
      where("instructorId", "==", instructorId),
    );
    const coursesSnapshot = await getDocs(instructorCoursesQuery);

    instructorCourseList.replaceChildren();

    if (coursesSnapshot.empty) {
      instructorCourseList.textContent = "You have no courses yet. Create your first course below.";
      placeholder.textContent = "Create a course first";
      return;
    }

    coursesSnapshot.docs.forEach((courseDocument) => {
      const course = courseDocument.data();
      const courseOption = document.createElement("option");
      courseOption.value = courseDocument.id;
      courseOption.textContent = `${course.code} - ${course.title}`;
      assignmentCourseSelect.append(courseOption);

      if (courseDocument.id === selectedCourseId) {
        courseOption.selected = true;
      }

      const courseCard = document.createElement("article");
      courseCard.classList.add("course-card");

      const titleElement = document.createElement("h3");
      titleElement.textContent = course.title;

      const codeElement = document.createElement("p");
      codeElement.textContent = `Course code: ${course.code}`;

      const descriptionElement = document.createElement("p");
      descriptionElement.textContent = course.description;

      courseCard.append(titleElement, codeElement, descriptionElement);
      instructorCourseList.append(courseCard);
    });
    placeholder.textContent = "Select one of your courses";
    assignmentCourseSelect.disabled = false;
  } catch (error) {
    assignmentCourseSelect.replaceChildren(placeholder);
    placeholder.textContent = "Could not load courses. Refresh to try again.";
    assignmentCourseSelect.disabled = true;
    instructorCourseList.textContent = "Could not load your courses. Please refresh to try again.";
    console.error("Course loading error:", error.code || error.message);
  }
}

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
    const userProfile = await getUserProfile(user);

    if (!userProfile) {
      await signOut(auth);
      window.location.replace("./index.html");
      return;
    }

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
    setupAssignmentForm();
    await loadInstructorCourses(user.uid);
    await loadInstructorAssignments(user.uid);
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
const createCourseButton = createCourseForm.querySelector('button[type="submit"]');

createCourseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (createCourseButton.disabled) return;

  const title = courseTitleInput.value.trim();
  const code = courseCodeInput.value.trim();
  const description = courseDescriptionInput.value.trim();

  courseMessage.textContent = "";

  if (!title || !code || !description) {
    courseMessage.textContent = "Please fill in all course fields.";
    courseMessage.style.color = "red";
    return;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    courseMessage.textContent = "Please log in to create a course.";
    courseMessage.style.color = "red";
    return;
  }

  createCourseButton.disabled = true;
  createCourseButton.textContent = "Creating course...";
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
    await loadInstructorCourses(currentUser.uid);
  } catch (error) {
    courseMessage.textContent = "Could not create the course. Please try again.";
    courseMessage.style.color = "red";
    console.error("Course creation error:", error.code || error.message);
  } finally {
    createCourseButton.disabled = false;
    createCourseButton.textContent = "Create course";
  }
});
