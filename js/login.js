const email = document.getElementById("email");
const password = document.getElementById("password");

const emailHelper = document.getElementById("emailHelper");
const passwordHelper = document.getElementById("passwordHelper");

const loginBtn = document.getElementById("loginBtn");
const modal = document.getElementById("loginModal");
const confirmModal = document.getElementById("confirmModal");

// 이메일 검증
function validateEmail(input) {

    if (!input.trim()) {
        return "이메일을 입력해주세요.";
    }

    const regex = /^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9._%+-]+@([A-Za-z0-9]+(-[A-Za-z0-9]+)*\.)+[A-Za-z]{2,}$/;
    if (!regex.test(input)) {
        return "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
    }

  return "";
}

// 비밀번호 검증
function validatePassword(input) {

    if (!input.trim()) {
        return "비밀번호를 입력해주세요.";
    }

    const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[^\s]{8,20}$/;
    if (!regex.test(input)) {
        return "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
    }

    return "";
}

function checkFormValidity() {
    const emailMsg = validateEmail(email.value);
    const passwordMsg = validatePassword(password.value);

    const allValid = !emailMsg && !passwordMsg;
    loginBtn.disabled = !allValid;
    loginBtn.classList.toggle("active", allValid);
}

email.addEventListener("input", () => {
    const msg = validateEmail(email.value);
    emailHelper.textContent = msg;
    checkFormValidity();
});

password.addEventListener("input", () => {
    const msg = validatePassword(password.value);
    passwordHelper.textContent = msg;
    checkFormValidity();
});

// 로그인 클릭
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const response = await fetch("http://localhost:8080/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email.value,
                password: password.value
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        modal.classList.remove("hidden");

        confirmModal.onclick = () => {
            modal.classList.add("hidden");
            window.location.href = "posts.html";
        };
    } catch (error) {
        alert("로그인 중 오류가 발생했습니다.");
    }
});