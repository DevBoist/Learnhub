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
import { element, formatDate, safeLink } from "./assignment-tools.js";

const db = getFirestore();

async function showSubmissions(assignmentDocument, container) {
  container.textContent = "Loading students...";
  try {
    const assignment = assignmentDocument.data();
    const instructorId = auth.currentUser?.uid;
    if (!instructorId || assignment.instructorId !== instructorId) throw new Error("Not your assignment");
    const submissions = await getDocs(
      query(
        collection(db, "submissions"),
        where("instructorId", "==", instructorId),
      ),
    );
    const enrollments = await getDocs(
      query(
        collection(db, "enrollments"),
        where("instructorId", "==", instructorId),
      ),
    );
    const courseEnrollments = enrollments.docs.filter((entry) => entry.data().courseId === assignment.courseId);
    const assignmentSubmissions = submissions.docs.filter((entry) => entry.data().assignmentId === assignmentDocument.id);
    const students = new Set(courseEnrollments.map((entry) => entry.data().studentId));
    assignmentSubmissions.forEach((entry) => students.add(entry.data().studentId));
    container.replaceChildren();
    if (!students.size) {
      container.textContent = "No students have enrolled in this course yet.";
      return;
    }

    for (const studentId of students) {
      const submissionDocument = assignmentSubmissions.find((entry) => entry.data().studentId === studentId);
      const row = element("section", undefined, "submission-row");
      const enrollment = courseEnrollments
        .find((entry) => entry.data().studentId === studentId)
        ?.data();
      const name =
        submissionDocument?.data().studentName ||
        enrollment?.studentName ||
        `Student ${studentId}`;
      row.append(element("h4", name));
      if (!submissionDocument) {
        row.append(element("p", "Not submitted"));
        container.append(row);
        continue;
      }

      const submission = submissionDocument.data();
      row.append(element("p", `Submitted: ${formatDate(submission.submittedAt)}`));
      const url = safeLink(submission.link);
      if (url) {
        const link = element("a", "Open submission", "text-link");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        row.append(link);
      } else {
        row.append(element("p", "Submission link is unavailable."));
      }
      if (submission.note) row.append(element("p", submission.note));

      const form = element("form", undefined, "grading-form");
      form.noValidate = true;
      const label = element("label", "Mark out of 100");
      const input = element("input");
      input.type = "number";
      input.min = "0";
      input.max = "100";
      input.step = "0.5";
      input.value = submission.marks ?? "";
      label.append(input);
      const button = element("button", "Save mark", "secondary-button");
      button.type = "submit";
      const message = element("p");
      message.setAttribute("role", "status");
      form.append(label, button, message);
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const marks = Number(input.value);
        if (
          input.value.trim() === "" ||
          !Number.isFinite(marks) ||
          marks < 0 ||
          marks > 100 ||
          (marks * 2) % 1 !== 0
        ) {
          message.textContent = "Enter a mark from 0 to 100, in steps of 0.5.";
          return;
        }
        button.disabled = true;
        button.textContent = "Saving...";
        message.textContent = "";
        try {
          await runTransaction(db, async (transaction) => {
            const currentAssignment = await transaction.get(
              doc(db, "assignments", assignmentDocument.id),
            );
            const currentSubmission = await transaction.get(submissionDocument.ref);
            if (
              !auth.currentUser ||
              !currentAssignment.exists() ||
              currentAssignment.data().instructorId !== auth.currentUser.uid
            ) {
              throw new Error("You can only mark your own assignments.");
            }
            if (
              !currentSubmission.exists() ||
              currentSubmission.data().assignmentId !== assignmentDocument.id
            ) {
              throw new Error("This submission is no longer available.");
            }
            transaction.update(submissionDocument.ref, {
              marks,
              gradedBy: auth.currentUser.uid,
              gradedAt: serverTimestamp(),
            });
          });
          message.textContent = `Saved: ${marks}/100.`;
        } catch {
          message.textContent = "Could not save the mark. Refresh and try again.";
        } finally {
          button.disabled = false;
          button.textContent = "Save mark";
        }
      });
      row.append(form);
      container.append(row);
    }
  } catch {
    container.textContent = "Could not load submissions. Close and reopen this section to retry.";
  }
}

export async function loadInstructorAssignments(instructorId) {
  const list = document.getElementById("instructor-assignment-list");
  list.textContent = "Loading assignments...";
  try {
    const assignments = await getDocs(
      query(
        collection(db, "assignments"),
        where("instructorId", "==", instructorId),
      ),
    );
    const courses = await getDocs(
      query(collection(db, "courses"), where("instructorId", "==", instructorId)),
    );
    list.replaceChildren();
    if (assignments.empty) {
      list.textContent = "You have no assignments yet.";
      return;
    }
    assignments.docs.forEach((assignmentDocument) => {
      const assignment = assignmentDocument.data();
      const course = courses.docs.find((entry) => entry.id === assignment.courseId);
      const card = element("article", undefined, "course-card assignment-card");
      card.append(
        element("h3", assignment.title),
        element(
          "p",
          course
            ? `${course.data().code} - ${course.data().title}`
            : "Course unavailable",
        ),
        element("p", `Due: ${formatDate(assignment.deadline)} (your local time)`),
        element("p", assignment.description),
      );
      const details = element("details");
      const submissions = element("div");
      details.append(
        element("summary", "View students, submissions and marks"),
        submissions,
      );
      details.addEventListener("toggle", () => {
        if (details.open) showSubmissions(assignmentDocument, submissions);
      });
      card.append(details);
      list.append(card);
    });
  } catch {
    list.textContent = "Could not load assignments. Refresh to try again.";
  }
}
