import { auth } from "./firebase.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { element, deadlineDate, formatDate, safeLink } from "./assignment-tools.js";

const db = getFirestore();

export async function loadStudentAssignments(user, courses, studentName = "") {
  const list = document.getElementById("assignment-list");
  list.textContent = "Loading assignments...";
  try {
    const submissions = await getDocs(
      query(collection(db, "submissions"), where("studentId", "==", user.uid)),
    );
    const cards = [];
    for (const course of courses) {
      const assignments = await getDocs(
        query(collection(db, "assignments"), where("courseId", "==", course.id)),
      );
      for (const assignmentDocument of assignments.docs) {
        const assignment = assignmentDocument.data();
        const submission = submissions.docs
          .find((entry) => entry.data().assignmentId === assignmentDocument.id)
          ?.data();
        const deadline = deadlineDate(assignment.deadline);
        const overdue = deadline && deadline <= new Date();
        const state = submission ? "Submitted" : overdue ? "Overdue" : "Pending";
        const card = element("article", undefined, "course-card assignment-card");
        card.append(
          element("h3", assignment.title),
          element("p", `${course.code} - ${course.title}`),
          element("p", `Due: ${formatDate(assignment.deadline)} (your local time)`),
          element("p", assignment.description),
          element("span", state, `status-badge ${state.toLowerCase()}`),
        );
        if (submission) {
          const markText =
            submission.marks == null
              ? "Awaiting marking"
              : `Your mark: ${submission.marks}/100`;
          card.append(element("p", markText));
        } else if (deadline && !overdue) {
          const form = element("form", undefined, "dashboard-form submission-form");
          form.noValidate = true;
          const label = element("label", "Submission link");
          const input = element("input");
          input.type = "url";
          input.placeholder = "https://...";
          label.append(input);
          const noteLabel = element("label", "Optional note");
          const note = element("textarea");
          note.rows = 2;
          noteLabel.append(note);
          const button = element("button", "Submit assignment", "primary-button");
          button.type = "submit";
          const message = element("p");
          message.setAttribute("role", "status");
          form.append(label, noteLabel, button, message);
          form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const link = safeLink(input.value.trim());
            if (!link) {
              message.textContent = "Enter a valid link starting with https:// or http://.";
              return;
            }
            button.disabled = true;
            button.textContent = "Submitting...";
            try {
              if (auth.currentUser?.uid !== user.uid) {
                throw new Error("Please sign in again.");
              }
              const enrollments = await getDocs(
                query(
                  collection(db, "enrollments"),
                  where("studentId", "==", user.uid),
                ),
              );
              if (!enrollments.docs.some((entry) => entry.data().courseId === course.id)) {
                throw new Error("You must enroll in this course first.");
              }
              const submissionRef = doc(
                db,
                "submissions",
                `${user.uid}_${assignmentDocument.id}`,
              );
              await runTransaction(db, async (transaction) => {
                const currentAssignment = await transaction.get(assignmentDocument.ref);
                const existing = await transaction.get(submissionRef);
                if (existing.exists()) {
                  throw new Error(
                    "Already submitted. Refresh to see your submission.",
                  );
                }
                const currentDeadline = currentAssignment.exists()
                  ? deadlineDate(currentAssignment.data().deadline)
                  : null;
                if (!currentDeadline || currentDeadline <= new Date()) {
                  throw new Error(
                    "The submission deadline has passed or is unavailable.",
                  );
                }
                if (currentAssignment.data().courseId !== course.id) {
                  throw new Error(
                    "This assignment has changed. Refresh to continue.",
                  );
                }
                transaction.set(submissionRef, {
                  assignmentId: assignmentDocument.id,
                  courseId: course.id,
                  studentId: user.uid,
                  studentName,
                  instructorId: currentAssignment.data().instructorId,
                  link,
                  note: note.value.trim(),
                  submittedAt: serverTimestamp(),
                });
              });
              await loadStudentAssignments(user, courses, studentName);
            } catch (error) {
              message.textContent = error.code
                ? "Could not submit. Please try again."
                : error.message;
            } finally {
              button.disabled = false;
              button.textContent = "Submit assignment";
            }
          });
          card.append(form);
        }
        cards.push(card);
      }
    }
    list.replaceChildren(...cards);
    if (!cards.length) list.textContent = "No assignments for your enrolled courses yet.";
  } catch {
    list.textContent = "Could not load assignments. Refresh to try again.";
  }
}
