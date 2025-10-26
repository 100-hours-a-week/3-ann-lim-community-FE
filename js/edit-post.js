const userProfileImg = document.querySelector(".user-profile");
const profileDropdown = document.querySelector(".profile-dropdown");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const logoutCompleteModal = document.getElementById("logoutCompleteModal");
const confirmLogoutComplete = document.getElementById("confirmLogoutComplete");
const profileDropdownButtons = profileDropdown.querySelectorAll("button");

const title = document.getElementById("title");
const content = document.getElementById("content");
const image = document.getElementById("image");
const submitBtn = document.getElementById("submitBtn");
const postForm = document.getElementById("postForm");
const postHelper = document.getElementById("postHelper");
const backBtn = document.querySelector(".back-btn");

const modal = document.getElementById("writePostModal");
const confirmModal = document.getElementById("confirmModal");

let selectedFiles = [];
let originalImages = [];
let postId = null;

let initialTitle = "";
let initialContent = "";
let initialImages = [];

// URL에서 postId 가져오기
postId = window.location.pathname.split("/").pop();

backBtn.addEventListener("click", () => {
    window.location.href = `/post/${postId}`;
});

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
                window.location.href = "/profile";
                break;
            case 1: // 비밀번호수정
                window.location.href = "/password";
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
                            window.location.href = "/login";
                        };
                    } catch (err) {
                        alert("로그아웃 중 오류가 발생했습니다.");
                    }
                };
                break;
        }
    });
});

function validatePost(title, content) {
    if (!title.trim() || !content.trim()) {
        return "제목, 내용을 모두 작성해주세요.";
    }
}

function checkFormValidity() {
    const postMsg = validatePost(title.value, content.value);
    postHelper.textContent = postMsg;

    const valid = !postMsg || selectedFiles.length > 0 || originalImages.length !== initialImages.length;
    submitBtn.disabled = !valid;
    submitBtn.classList.toggle("active", valid);
}

title.addEventListener("input", checkFormValidity);
content.addEventListener("input", checkFormValidity);

// 기존 게시글 불러오기
async function loadPostData() {
    try {
        const response = await fetch(`http://localhost:8080/posts/${postId}/edit`);
        if (!response.ok) {
            throw new Error("게시글 정보를 불러오지 못했습니다.");
        }
        const data = await response.json();
        console.log("🔥 서버 응답 데이터:", data);

        title.value = data.data.title;
        content.value = data.data.content;
        originalImages = data.data.images || [];

        initialTitle = data.data.title;
        initialContent = data.data.content;
        initialImages = data.data.images || [];

    renderImageList();
    } catch (err) {
        alert("게시글 수정 정보를 불러오지 못했습니다.");
    }
}

// 기존 이미지 표시
function renderImageList() {
    const fileListContainer = document.getElementById("fileList") || createFileList();
    fileListContainer.innerHTML = "";

    originalImages.forEach((img, index) => {
        const chip = createChip(`${img.image_name}.${img.extension}`, () => {
            originalImages = originalImages.filter(
                (image) => image.image_url !== img.image_url
            );
            renderImageList();
            checkFormValidity();
        });
        fileListContainer.appendChild(chip);
    });

    selectedFiles.forEach((file, index) => {
        const chip = createChip(file.name, () => {
            selectedFiles.splice(index, 1);
            renderImageList();
            checkFormValidity();
        });
        fileListContainer.appendChild(chip);
    });
}


function createChip(label, onRemove) {
    const chip = document.createElement("div");
    chip.classList.add("file-chip");

    const span = document.createElement("span");
    span.textContent = label;

    const btn = document.createElement("button");
    btn.textContent = "x";
    btn.classList.add("remove-btn");
    btn.addEventListener("click", onRemove);

    chip.appendChild(span);
    chip.appendChild(btn);

    return chip;
}

function createFileList() {
    const div = document.createElement("div");
    div.id = "fileList";
    div.classList.add("file-list");
    image.insertAdjacentElement("afterend", div);

    return div;
}

// 이미지 선택 시 추가
image.addEventListener("change", (e) => {
    const newFiles = Array.from(e.target.files);
    selectedFiles.push(...newFiles);
    renderImageList();
});

// S3 업로드
async function uploadImagesToS3(files) {
    if (!files.length) {
        return [];
    }
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
        const response = await fetch("http://localhost:8080/images", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }

        return result.data.images.map((url, idx) => {
            const file = files[idx];
            const fullName = file.name;
            const dotIndex = fullName.lastIndexOf(".");
            const name = dotIndex !== -1 ? fullName.substring(0, dotIndex) : fullName;
            const extension = dotIndex !== -1 ? fullName.substring(dotIndex + 1) : "";

            return {
                image_url: url,
                image_name: name,
                extension: extension,
            };
        });
    } catch (err) {
        alert("이미지 업로드 중 오류 발생");
        return [];
    }
}

// 게시글 수정
async function updatePost() {
    const postTitle = title.value;
    const postContent = content.value;
    
    const msg = validatePost(postTitle, postContent);
    if (msg) {
        alert(msg);
        return;
    }

    const isTitleChanged = postTitle !== initialTitle;
    const isContentChanged = postContent !== initialContent;
    const isImageChanged =
        selectedFiles.length > 0 ||
        originalImages.length !== initialImages.length ||
        !originalImages.every((img, idx) =>
            img.image_url === initialImages[idx]?.image_url
        );

    if (!isTitleChanged && !isContentChanged && !isImageChanged) {
        modal.classList.remove("hidden");
        confirmModal.onclick = () => {
            modal.classList.add("hidden");
            window.location.href = `/post/${postId}`;
        };
        return;
    }

    try {
        let uploaded = [];
        if (selectedFiles.length > 0) {
            uploaded = await uploadImagesToS3(selectedFiles);
        }

        const requestBody = {};
        if (isTitleChanged) {
            requestBody.title = postTitle;
        }
        if (isContentChanged) {
            requestBody.content = postContent;
        }
        if (isImageChanged) {
            const mergedImages = [...originalImages, ...uploaded];
            requestBody.post_images = mergedImages.map(img => ({
                image_url: img.image_url,
                image_name: img.image_name,
                extension: img.extension
            }));
        }

        if (!requestBody.post_images) {
            requestBody.post_images = [];
        }
        
        const response = await fetch(`http://localhost:8080/posts/${postId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();
        if (response.ok) {
            modal.classList.remove("hidden");
            confirmModal.onclick = () => {
                modal.classList.add("hidden");
                window.location.href = `/post/${postId}`;
            };
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        alert("게시글 수정 중 오류가 발생했습니다.");
    }
}

submitBtn.addEventListener("click", updatePost);

loadUserProfile();
loadPostData();