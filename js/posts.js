const userProfileImg = document.querySelector(".user-profile");
const profileDropdown = document.querySelector(".profile-dropdown");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const logoutCompleteModal = document.getElementById("logoutCompleteModal");
const confirmLogoutComplete = document.getElementById("confirmLogoutComplete");
const profileDropdownButtons = profileDropdown.querySelectorAll("button");
const postList = document.getElementById("postList");
const writeBtn = document.getElementById("writeBtn");

let lastPostCreatedAt = null;
let lastPostId = null;
let isLoading = false;

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

writeBtn.addEventListener("click", () => {
    window.location.href = "/write"; 
});

// 마지막 카드가 보이면 다음 데이터 호출
const observer = new IntersectionObserver(
    (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isLoading) {
            observer.unobserve(lastEntry.target);
            fetchPosts();
        }
    }
);

// 게시글 불러오기 함수
async function fetchPosts() {

    if (isLoading) {
        return;
    }
    isLoading = true;

    try {
        let url = "http://localhost:8080/posts"

        if (lastPostCreatedAt && lastPostId) {
            const formattedDate = lastPostCreatedAt.replace(" ", "T");
            url += `?lastPostCreatedAt=${formattedDate}&lastPostId=${lastPostId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("게시글을 불러오지 못했습니다.");
        }
        
        const data = await response.json();
        const posts = data.data.posts;

        if (!posts || posts.length === 0) {
            return;
        }

        renderPosts(posts);

        lastPostCreatedAt = data.data.last_post_created_at;
        lastPostId = data.data.last_post_id;

        if (postList.lastElementChild) {
            observer.observe(postList.lastElementChild);
        } 
    } catch (err) {
        alert("게시글 목록 조회 중 오류가 발생했습니다.")
    } finally {
        isLoading = false;
    }
}

// 게시글 렌더링 함수
function renderPosts(posts) {

    posts.forEach(post => {
        const card = document.createElement("div");
        card.classList.add("post-card");

        card.innerHTML = `
            <div class="post-head">
                <h3 class="post-title">${post.title}</h3>
            </div>
            <div class="post-meta">
                <div class="post-meta-left">
                    <span>좋아요 ${formatNumber(post.like_count)}</span>
                    <span>댓글 ${formatNumber(post.comment_count)}</span>
                    <span>조회수 ${formatNumber(post.view_count)}</span>
                </div>
                <span class="post-date">${post.created_at.replace("T", " ")}</span>
            </div>
            <div class="author">
                <img class="profile" src="${post.profile_image || "../assets/default-profile.png"}" alt="profile" />
                <span>${post.nickname}</span>
            </div>
        `;

        // 게시글 클릭 시 상세 페이지로 이동
        card.addEventListener("click", () => {
            window.location.href = `/post/${post.post_id}`;
        });

        postList.appendChild(card);
    });

    // 마지막 게시글 요소에 옵저버 붙이기
    const lastCard = postList.lastElementChild;
    if (lastCard) {
        observer.observe(lastCard);
    }
}

// 숫자 포맷 함수
function formatNumber(num) {

    if (num >= 1000) {
        return `${Math.floor(num / 1000)}k`;
    }
  
    return num;
}

// 게시글 로드
loadUserProfile().then(fetchPosts);