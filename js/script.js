const authCard = document.getElementById("auth-card");
const showLoginButton = document.getElementById("show-login");

showLoginButton.addEventListener("click", ()=>{
    authCard.classList.add("is-login")
});

const showRegisterButton = document.getElementById("show-register");
showRegisterButton.addEventListener("click", ()=>{
    authCard.classList.remove("is-login")
});

const registerForm = document.getElementById("register-form");

const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const registerEmailInput = document.getElementById("register-email");
const registerPasswordInput = document.getElementById("register-password");
const registerRoleSelect = document.getElementById("register-role");

const registerMessage = document.getElementById("register-message");

registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    registerMessage.textContent = "";

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;
    const role = registerRoleSelect.value;

    if (!firstName || !lastName || !email || !password || !role) {
        registerMessage.textContent = "Please fill in all required fields.";
        registerMessage.style.color = "red";
        registerMessage.style.fontWeight = "bold";
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/;

    if (!emailRegex.test(email)) {
    registerMessage.textContent = "Please enter a valid email address.";
    return;
}

if (!passwordRegex.test(password)) {
    registerMessage.textContent =
        "Your password must contain at least 8 characters, including a letter and a number";
    return;
}


});