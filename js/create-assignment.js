import { auth } from "./firebase.js";
import {
  getFirestore,
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { setupDeadlinePicker } from "./deadline-picker.js";
import { loadInstructorAssignments } from "./instructor-assignments.js";

let initialized = false;

export function setupAssignmentForm() {
  if (initialized) return;
  initialized = true;
  const db = getFirestore();
  const form = document.getElementById("create-assignment-form");
  const titleInput = document.getElementById("assignment-title");
  const descriptionInput = document.getElementById("assignment-description");
  const courseInput = document.getElementById("assignment-course");
  const button = document.getElementById("create-assignment-button");
  const message = document.getElementById("assignment-message");
  const picker = setupDeadlinePicker();
  button.disabled = false;
  let saving = false;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (saving) return;
    message.textContent = "";
    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const courseId = courseInput.value;
    const deadline = picker.getDeadline();
    if (!title || !description || !courseId) {
      message.textContent = "Enter a title and description, and select one of your courses.";
      return;
    }
    if (!deadline) {
      message.textContent = "Choose a valid deadline date, hour, minute and AM or PM.";
      return;
    }
    if (deadline <= new Date()) {
      message.textContent = "The deadline must be in the future.";
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      message.textContent = "Please sign in as an instructor to create an assignment.";
      return;
    }
    saving = true;
    button.disabled = true;
    button.textContent = "Creating assignment...";
    try {
      const assignmentRef = doc(collection(db, "assignments"));
      await runTransaction(db, async (transaction) => {
        const course = await transaction.get(doc(db, "courses", courseId));
        if (!course.exists() || course.data().instructorId !== user.uid || auth.currentUser?.uid !== user.uid) {
          throw new Error("Select a course that belongs to your instructor account.");
        }
        if (deadline <= new Date()) throw new Error("The deadline must still be in the future.");
        transaction.set(assignmentRef, {
          title, description, courseId, deadline,
          instructorId: user.uid,
          createdAt: serverTimestamp(),
        });
      });
      form.reset();
      picker.reset();
      message.textContent = "Assignment created successfully.";
      await loadInstructorAssignments(user.uid);
    } catch (error) {
      message.textContent = error.code
        ? "Could not create the assignment. Please check your connection and try again."
        : error.message;
    } finally {
      saving = false;
      button.disabled = false;
      button.textContent = "Create assignment";
    }
  });
}
