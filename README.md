# LearnHub

LearnHub is a course management website made with HTML, CSS, JavaScript, Firebase Authentication, and Firestore.

Students can find courses, enroll, view assignments, submit a link, and see their marks. Instructors can create courses and assignments, see student submissions, and give marks.

## Run the project

Open the folder in VS Code and start Live Server from `index.html`. The site should open at `http://127.0.0.1:5500`.

The Firebase connection is in `js/firebase.js`. Firestore uses the access rules currently set in the Firebase console.

## Check that it works

1. Register and sign in as an instructor.
2. Create a course and an assignment with a future deadline.
3. Register and sign in as a student.
4. Enroll in the course. Check that it appears in My courses and that its assignment appears in Assignments.
5. Submit a link for the assignment.
6. Sign in as the instructor again. Open the assignment, check the submission, and give it a mark.
7. Sign in as the student again and check that the mark appears.

An assignment is Pending before its deadline, Overdue after its deadline, and Submitted when the student has submitted it.
