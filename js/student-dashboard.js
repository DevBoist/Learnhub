import { auth } from "./firebase.js";
import { loadStudentAssignments } from "./student-assignments.js";
import { getUserProfile } from "./user-profile.js";
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
  doc,
  getDoc,
  setDoc,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const db = getFirestore();
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
    const userProfile = await getUserProfile(user);

    if (!userProfile) {
      await signOut(auth);
      window.location.replace("./index.html");
      return;
    }

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

    for (const enrollmentDocument of studentEnrollmentsSnapshot.docs) {
      const enrollment = enrollmentDocument.data();
      const course = courses.find((entry) => entry.id === enrollment.courseId);
      if (!course) continue;
      const stableId = `${user.uid}_${course.id}`;
      const stableRef = doc(db, "enrollments", stableId);
      if (!(await getDoc(stableRef)).exists()) {
        await setDoc(stableRef, {
          studentId: user.uid,
          studentName: `${userProfile.firstname} ${userProfile.lastname}`.trim(),
          courseId: course.id,
          instructorId: course.instructorId,
          enrolledAt: enrollment.enrolledAt || new Date(),
        });
      }
    }

    const enrolledCourses = courses.filter((course) =>
      enrolledCourseIds.has(course.id),
    );
    const studentName = `${userProfile.firstname} ${userProfile.lastname}`.trim();
    await loadStudentAssignments(user, enrolledCourses, studentName);

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
      const enrollmentMessage = document.createElement("p");
      enrollmentMessage.setAttribute("role", "status");

      enrollButton.addEventListener("click", async () => {
        enrollButton.disabled = true;
        enrollButton.textContent = "Checking...";
        enrollmentMessage.textContent = "";

        try {
          const existingEnrollmentQuery = query(
            enrollmentColRef,
            where("studentId", "==", user.uid),
          );
          const existingEnrollmentSnapshot = await getDocs(
            existingEnrollmentQuery,
          );

          if (existingEnrollmentSnapshot.docs.some(
            (entry) => entry.data().courseId === course.id,
          )) {
            enrollButton.textContent = "Already enrolled";
            return;
          }

          const stableRef = doc(db, "enrollments", `${user.uid}_${course.id}`);
          await runTransaction(db, async (transaction) => {
            const existing = await transaction.get(stableRef);
            if (existing.exists()) return;
            transaction.set(stableRef, {
              studentId: user.uid,
              studentName: `${userProfile.firstname} ${userProfile.lastname}`.trim(),
              courseId: course.id,
              instructorId: course.instructorId,
              enrolledAt: new Date(),
            });
          });

          enrollButton.textContent = "Enrolled";
          if (!enrolledCourses.some((entry) => entry.id === course.id)) {
            enrolledCourses.push(course);
            if (enrolledCourses.length === 1) enrolledCourseList.replaceChildren();
            const enrolledCard = document.createElement("article");
            enrolledCard.classList.add("course-card");
            const enrolledTitle = document.createElement("h3");
            enrolledTitle.textContent = course.title;
            const enrolledCode = document.createElement("p");
            enrolledCode.textContent = `Course code: ${course.code}`;
            const enrolledDescription = document.createElement("p");
            enrolledDescription.textContent = course.description;
            enrolledCard.append(enrolledTitle, enrolledCode, enrolledDescription);
            enrolledCourseList.append(enrolledCard);
          }
          await loadStudentAssignments(user, enrolledCourses, studentName);
        } catch (error) {
          enrollButton.disabled = false;
          enrollButton.textContent = "Enroll";
          enrollmentMessage.textContent = "Could not enroll. Please try again.";
          console.error("Course enrollment error:", error.code || error.message);
        }
      });

      courseCard.append(
        titleElement,
        codeElement,
        descriptionElement,
        enrollButton,
        enrollmentMessage,
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
