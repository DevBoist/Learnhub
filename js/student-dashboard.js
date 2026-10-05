import { auth } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  addDoc,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore();
const userColRef = collection(db, "users");
const courseColRef = collection(db, "courses");
const enrollmentColRef = collection(db, "enrollments");
const availableCourseList = document.getElementById("available-course-list");
const enrolledCourseList = document.getElementById("enrolled-course-list");

const profileName = document.getElementById("profile-name");
const profileRole = document.getElementById("user-role");
const profileEmail = document.getElementById("profile-email");
const logoutButton = document.getElementById("logout-button");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("./index.html");
    return;
  }

  try {
    const userProfilesQuery = query(userColRef, where("uid", "==", user.uid));

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

    const coursesSnapshot = await getDocs(courseColRef);
    const courses = coursesSnapshot.docs.map((courseDocument) => {
      const courseData = courseDocument.data();

      return {
        id: courseDocument.id,
        title: courseData.title,
        code: courseData.code,
        description: courseData.description,
        instructorId: courseData.instructorId,
      };
    });

    const studentEnrollmentsQuery = query(
      enrollmentColRef,
      where("studentId", "==", user.uid),
    );
    const studentEnrollmentsSnapshot = await getDocs(studentEnrollmentsQuery);
    const enrolledCourseIds = new Set(
      studentEnrollmentsSnapshot.docs.map(
        (enrollmentDocument) => enrollmentDocument.data().courseId,
      ),
    );

    const enrolledCourses = courses.filter((course) =>
      enrolledCourseIds.has(course.id),
    );

    if (enrolledCourses.length > 0) {
      enrolledCourseList.replaceChildren();

      enrolledCourses.forEach((course) => {
        const courseCard = document.createElement("article");
        courseCard.classList.add("course-card");

        const titleElement = document.createElement("h3");
        titleElement.textContent = course.title;

        const codeElement = document.createElement("p");
        codeElement.textContent = `Course code: ${course.code}`;

        const descriptionElement = document.createElement("p");
        descriptionElement.textContent = course.description;

        courseCard.append(titleElement, codeElement, descriptionElement);
        enrolledCourseList.append(courseCard);
      });
    }

    if (courses.length > 0) {
      availableCourseList.replaceChildren();
    }

    courses.forEach((course) => {
      const courseCard = document.createElement("article");
      courseCard.classList.add("course-card");

      const titleElement = document.createElement("h3");
      titleElement.textContent = course.title;

      const codeElement = document.createElement("p");
      codeElement.textContent = `Course code: ${course.code}`;

      const descriptionElement = document.createElement("p");
      descriptionElement.textContent = course.description;

      const enrollButton = document.createElement("button");
      enrollButton.type = "button";
      enrollButton.classList.add("secondary-button");
      const isAlreadyEnrolled = enrolledCourseIds.has(course.id);
      enrollButton.textContent = isAlreadyEnrolled ? "Enrolled" : "Enroll";
      enrollButton.disabled = isAlreadyEnrolled;

      enrollButton.addEventListener("click", async () => {
        enrollButton.disabled = true;
        enrollButton.textContent = "Checking...";

        try {
          const existingEnrollmentQuery = query(
            enrollmentColRef,
            where("studentId", "==", user.uid),
            where("courseId", "==", course.id),
          );
          const existingEnrollmentSnapshot = await getDocs(
            existingEnrollmentQuery,
          );

          if (!existingEnrollmentSnapshot.empty) {
            enrollButton.textContent = "Already enrolled";
            return;
          }

          await addDoc(enrollmentColRef, {
            studentId: user.uid,
            courseId: course.id,
            enrolledAt: new Date(),
          });

          enrollButton.textContent = "Enrolled";
        } catch (error) {
          enrollButton.disabled = false;
          enrollButton.textContent = "Enroll";
          console.error("Course enrollment error:", error.code || error.message);
        }
      });

      courseCard.append(
        titleElement,
        codeElement,
        descriptionElement,
        enrollButton,
      );
      availableCourseList.append(courseCard);
    });
  } catch (error) {
    profileName.textContent = "Profile unavailable";
    profileEmail.textContent = "Could not load your account details.";
    console.error("Student profile error:", error.code || error.message);
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "./index.html";
  } catch (error) {
    console.error("Logout error:", error.code);
  }
});




