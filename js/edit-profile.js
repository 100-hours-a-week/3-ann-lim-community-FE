const userProfileImg = document.querySelector(".user-profile");
const profileDropdown = document.querySelector(".profile-dropdown");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const logoutCompleteModal = document.getElementById("logoutCompleteModal");
const confirmLogoutComplete = document.getElementById("confirmLogoutComplete");
const profileDropdownButtons = profileDropdown.querySelectorAll("button");

const backBtn = document.querySelector(".back-btn");

const nickname = document.getElementById("nickname");
const nicknameHelper = document.getElementById("nicknameHelper");
const updateBtn = document.getElementById("updateBtn");
const signoutBtn = document.getElementById("signoutBtn");

const toast = document.getElementById("toast");

const signoutModal = document.getElementById("signoutModal");
const signoutCompleteModal = document.getElementById("signoutCompleteModal");
const cancelSignout = document.getElementById("cancelSignout");
const confirmSignout = document.getElementById("confirmSignout");
const confirmSignoutComplete = document.getElementById("confirmSignoutComplete");

let selectedFile = null;

let initialProfileImage = "";
let initialNickname = "";

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
                window.location.reload();
                break;
            case 1: // 비밀번호수정
                window.location.href = "../html/change-password.html";
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

// ====== 토스트 표시 함수 ======
function showToast() {
    toast.textContent = "수정 완료";
    toast.classList.add("show");
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hidden");
    }, 2000);
}

// 닉네임 검증
function validateNickname(input) {

    if (!input.trim()) {
        return "닉네임을 입력해주세요.";
    }

    const regex = /^(?!.*\s).+$/;
    if (!regex.test(input)) {
        return "띄어쓰기를 없애주세요.";
    }

    return "";
}

function checkFormValidity() {
    const msg = validateNickname(nickname.value);
    nicknameHelper.textContent = msg;

    const valid = !msg;
    updateBtn.disabled = !valid;
    updateBtn.classList.toggle("active", valid);
}

nickname.addEventListener("input", () => {
    const msg = validateNickname(nickname.value);
    nicknameHelper.textContent = msg;
    checkFormValidity();
});

// 프로필 이미지 업로드
const profileImg = document.getElementById("profileImg");
const profilePreview = document.getElementById("profilePreview");
const changeProfileBtn = document.getElementById("changeProfileBtn");
const profileInput = document.getElementById("profileInput");


profileImg.addEventListener("click", () => profileInput.click());

profileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        profilePreview.src = event.target.result;
    };
    reader.readAsDataURL(file);

    selectedFile = file;
    checkFormValidity();
});

// S3 업로드 함수=
async function uploadImageToS3(file) {
    const formData = new FormData();
    formData.append("files", file);

    try {
        const response = await fetch("http://localhost:8080/images", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }

        return result.data.images[0];
    } catch (error) {
        alert("이미지 업로드 중 오류가 발생했습니다.");
        return null;
    }
}

// 사용자 정보 불러오기
// Todo
async function loadUserData() {
    try {
        const response = await fetch("http://localhost:8080/users/1");

        if (!response) {
            throw new Error("회원 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();
        const user = data.data;

        email.textContent = user.email;
        nickname.value = user.nickname;
        profilePreview.src = user.profile_image || "../assets/default-profile.png";

        initialProfileImage = user.profile_image;
        initialNickname = user.nickname;
    } catch (error) {
        console.error(error);
    }
}

// 회원정보 수정
// Todo
document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        let imageUrl = initialProfileImage;
        let isImageChanged = false;

        if (selectedFile) {
            uploadedUrl = await uploadImageToS3(selectedFile);
            if (uploadedUrl && uploadedUrl !== imageUrl) {
                imageUrl = uploadedUrl;
                isImageChanged = true;
            }
        }

        const isNicknameChanged = nickname.value !== initialNickname;

        if (!isNicknameChanged && !isImageChanged) {
            showToast();
            return;
        }

        const requestBody = {};
        if (isNicknameChanged) {
            requestBody.nickname = nickname.value;
        }
        if (isImageChanged) {
            requestBody.profile_image = imageUrl;
        }

        const response = await fetch("http://localhost:8080/users/1", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error("회원정보 수정 실패");
        }

        showToast();
    } catch (error) {
        alert("회원정보 수정 중 오류가 발생했습니다.");
    }
});

// 회원탈퇴
// Todo
signoutBtn.addEventListener("click", () => {
    signoutModal.classList.remove("hidden");
});

cancelSignout.addEventListener("click", () => {
    signoutModal.classList.add("hidden");
});

confirmSignout.addEventListener("click", async () => {
    try {
        const response = await fetch("http://localhost:8080/users/1", {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("회원탈퇴 실패");
        }

        signoutModal.classList.add("hidden");
        signoutCompleteModal.classList.remove("hidden");
    } catch (error) {
        alert("회원탈퇴 중 오류가 발생했습니다.");
    }
});

confirmSignoutComplete.addEventListener("click", () => {
    signoutCompleteModal.classList.add("hidden");
    window.location.href = "login.html";
});

loadUserProfile();
loadUserData();