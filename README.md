# LearnHub

A learning management system built with HTML, CSS, JavaScript, Firebase Authentication, and Firestore.

## Current progress

The registration and login interfaces are built. The forms have not been connected to JavaScript or Firebase yet.

- Registration: first name, last name, email, password, and Student/Instructor role.
- Login: email and password.
- A blue welcome panel has CSS for sliding between the two forms.
- On small screens, the welcome panel sits above the active form.

## Files

```text
Learnhub/
|-- index.html       Page structure and both forms
|-- css/
|   `-- style.css    Layout, colors, animation, and phone styles
|-- js/
|   `-- script.js    JavaScript we will write one feature at a time
`-- README.md        Project notes and setup instructions
```

Open `index.html` in your browser to view the current interface. Save your edits and refresh the browser to see changes.

## Understanding the HTML and CSS

Start with the section comments in `index.html`, then follow the numbered sections in `css/style.css`.

| Name | Purpose |
| --- | --- |
| `auth-card` | Contains both forms and the welcome panel. |
| `register-panel` | Holds the registration form on the left. |
| `login-panel` | Holds the login form on the right; initially hidden. |
| `welcome-panel` | The blue panel positioned over one half of the card. |
| `form-field` | Groups a label with its input or select element. |
| `is-login` | A CSS class that switches the card to its login layout. |

A **class** lets elements share styles. An **id** identifies one element; our JavaScript will use IDs to find buttons, inputs, and the card.

The CSS rule `.auth-card.is-login .welcome-panel` means: style the welcome panel inside a card that has both the `auth-card` and `is-login` classes.

In that rule, `translateX(-100%)` moves the blue panel left by its own width. The `transition` makes that movement smooth. Adding or removing `is-login` will be our first JavaScript feature.

The decorative book and circles are in their own CSS section. They do not affect the registration or login logic.

## JavaScript learning order

1. Make the Log in button show the login form.
2. Make the Create an account button return to registration.
3. Handle form submission and read the input values.
4. Create accounts with Firebase Authentication.
5. Save first name, last name, and role in Firestore using the account's user ID.
6. Sign in and load the saved user profile.

We will use descriptive variable names, `const` for variables we do not reassign, small named functions, and event listeners. Each step should work and be explainable before we add the next one.

## Git and GitHub

This repository already uses the SSH remote `git@github.com:DevBoist/Learnhub.git`. The current working branch is `testmod`.

Run these commands from the project folder to save and upload this layout:

```powershell
git status
git add index.html css/style.css js/script.js README.md
git commit -m "Build registration and login layout"
git push -u origin testmod
```

- `status` shows what changed.
- `add` selects the files for your next commit.
- `commit` saves a named checkpoint on your computer.
- `push` uploads commits to GitHub. The first `-u` connects your local branch to the remote branch, so later you can use `git push`.

After pushing, select the `testmod` branch on GitHub to see these files.

To inspect the remote or test SSH yourself:

```powershell
git remote -v
ssh -T git@github.com
```

GitHub's successful SSH greeting also says it does not provide shell access. That is normal: this connection is for Git operations.

Reference: [GitHub's SSH connection guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/testing-your-ssh-connection).

## Remaining project features

- Instructor course creation and student course lists.
- Enrollment with duplicate prevention.
- Instructor assignment creation and student assignment lists.
- Pending, Submitted, and Overdue assignment statuses.
- Firebase access rules and deployment to Vercel.
