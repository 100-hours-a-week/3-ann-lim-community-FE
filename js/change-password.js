const userProfileImg = document.querySelector(".user-profile");
const profileDropdown = document.querySelector(".profile-dropdown");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const logoutCompleteModal = document.getElementById("logoutCompleteModal");
const confirmLogoutComplete = document.getElementById("confirmLogoutComplete");
const profileDropdownButtons = profileDropdown.querySelectorAll("button");

const backBtn = document.querySelector(".back-btn");

const password = document.getElementById("password");
const passwordConfirm = document.getElementById("passwordConfirm");

const passwordHelper = document.getElementById("passwordHelper");
const passwordConfirmHelper = document.getElementById("passwordConfirmHelper");

const submitBtn = document.getElementById("submitBtn");

const toast = document.getElementById("toast");

backBtn.addEventListener("click", () => {
    window.location.href = "posts.html";
});

// Todo
async function loadUserProfile() {
    try {
        const response = await fetch("http://localhost:8080/users/me");

        if (!response.ok) {
            throw new Error("유저 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();

        if (data.data.profile_image) {
            userProfileImg.src = data.data.profile_image;
        }
        else {
            userProfileImg.src = "../assets/default-profile.png";
        }

    } catch (err) {
        console.error(err);
    }
}

userProfileImg.addEventListener("click", () => {
    profileDropdown.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== userProfileImg) {
        profileDropdown.classList.add("hidden");
    }
});

// 프로필 드롭다운의 각 버튼 클릭 시 페이지 이동
profileDropdownButtons.forEach((btn, index) => {
    btn.addEventListener("click", async () => {
        switch (index) {
            case 0: // 회원정보수정
                window.location.href = "edit-profile.html";
                break;
            case 1: // 비밀번호수정
                window.location.reload();
                break;
            case 2: // 로그아웃
                logoutModal.classList.remove("hidden");

                cancelLogout.onclick = () => {
                    logoutModal.classList.add("hidden");
                };
                confirmLogout.onclick = async() => {
                    try {
                        const response = await fetch("http://localhost:8080/auth", {
                            method: "DELETE"
                        });

                        if (!response.ok) {
                            throw new Error("로그아웃 요청 실패");
                        }

                        logoutModal.classList.add("hidden");
                        logoutCompleteModal.classList.remove("hidden");

                        confirmLogoutComplete.onclick = () => {
                            logoutCompleteModal.classList.add("hidden");
                            window.location.href = "../html/login.html";
                        };
                    } catch (err) {
                        alert("로그아웃 중 오류가 발생했습니다.");
                    }
                };
                break;
        }
    });
});

// 토스트 표시 함수
function showToast() {
    toast.textContent = "수정 완료";
    toast.classList.add("show");
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hidden");
    }, 2000);
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

// 비밀번호 확인 검증
function validatePasswordConfirm(input) {

    if (!input.trim()) {
        return "비밀번호를 한번 더 입력해주세요.";
    }

    if (password.value !== passwordConfirm.value) {
      return "비밀번호가 다릅니다.";
    }

    return "";
}

function checkFormValidity() {
    const passwordMsg = validatePassword(password.value);
    const passwordConfirmMsg = validatePasswordConfirm(passwordConfirm.value);

    const allValid = !passwordMsg && !passwordConfirmMsg;
    submitBtn.disabled = !allValid;
    submitBtn.classList.toggle("active", allValid);
}

password.addEventListener("input", () => {
    const msg = validatePassword(password.value);
    passwordHelper.textContent = msg;
    checkFormValidity();
});

passwordConfirm.addEventListener("input", () => {
    const msg = validatePasswordConfirm(passwordConfirm.value);
    passwordConfirmHelper.textContent = msg;
    checkFormValidity();
});

// 수정하기 클릭
// Todo
document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const response = await fetch("http://localhost:8080/users/1/password", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                password: password.value,
                password_confirm: passwordConfirm.value
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message);
        }

        showToast();
    } catch (error) {
        alert("비밀번호 수정 중 오류가 발생했습니다.");
    }
});

loadUserProfile();