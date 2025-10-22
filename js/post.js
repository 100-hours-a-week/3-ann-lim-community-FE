const userProfileImg = document.querySelector(".user-profile");
const profileDropdown = document.querySelector(".profile-dropdown");
const logoutModal = document.getElementById("logoutModal");
const cancelLogout = document.getElementById("cancelLogout");
const confirmLogout = document.getElementById("confirmLogout");
const logoutCompleteModal = document.getElementById("logoutCompleteModal");
const confirmLogoutComplete = document.getElementById("confirmLogoutComplete");
const profileDropdownButtons = profileDropdown.querySelectorAll("button");

const postTitle = document.querySelector(".post-title");
const profileImage = document.querySelector(".profile-image");
const author = document.querySelector(".author");
const date = document.querySelector(".date");
const content = document.querySelector(".content");
const likeBtn = document.querySelector(".like-btn");
const viewsCount = document.querySelector(".views-count");
const commentsCount = document.querySelector(".comments-count");
const imageContainer = document.querySelector(".image-container");

const editBtn = document.querySelector(".edit-btn");
const deleteBtn = document.querySelector(".delete-btn");

const postDeleteModal = document.getElementById("postDeleteModal");
const postDeleteCompleteModal = document.getElementById("postDeleteCompleteModal");
const confirmPostDelete = postDeleteModal.querySelector("#confirmDelete");
const cancelPostDelete = postDeleteModal.querySelector("#cancelDelete");
const postDeleteCompleteBtn = postDeleteCompleteModal.querySelector("#postDeleteComplete");

const commentInput = document.getElementById("commentInput");
const submitComment = document.getElementById("submitComment");

const commentDeleteModal = document.getElementById("commentDeleteModal");
const commentDeleteCompleteModal = document.getElementById("commentDeleteCompleteModal");
const confirmCommentDelete = commentDeleteModal.querySelector("#confirmDelete");
const cancelCommentDelete = commentDeleteModal.querySelector("#cancelDelete");
const commentDeleteCompleteBtn = commentDeleteCompleteModal.querySelector("#commentDeleteComplete");

const commentList = document.getElementById("commentList");

let postId = null;
let isLiked = false;
let likeId = null;
let commentId = null;
let targetCommentElement = null;
let lastCommentCreatedAt = null;
let lastCommentId = null;
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
                window.location.href = "../html/edit-profile.html";
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

// 게시글 데이터 요청
async function fetchPostData(postId) {
    const response = await fetch(`http://localhost:8080/posts/${postId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message)
    };

    return result.data;
}

// 게시글 렌더링
function renderPost(post) {
    postTitle.textContent = post.title;
    author.textContent = post.nickname;
    date.textContent = post.created_at?.replace("T", " ");
    content.textContent = post.content;
    likeBtn.textContent = `${post.like_count} 좋아요`;
    viewsCount.textContent = `${post.view_count} 조회수`;
    commentsCount.textContent = `${post.comment_count} 댓글`;

    if (post.profile_image) {
        profileImage.src = post.profile_image;
    }
  
    if (post.images != null) {
        renderImages(post.images);
    }
}

// 이미지 렌더링
function renderImages(images = []) {
    imageContainer.innerHTML = "";
    if (images.length === 0) {
      return;
    }

    images
        .sort((a, b) => a.orderNum - b.orderNum)
        .forEach(img => {
            const imgElement = document.createElement("img");
            imgElement.src = img.image_url;
            imgElement.alt = `image-${img.image_id}`;
            imgElement.classList.add("post-image");
            imageContainer.appendChild(imgElement);
        });
}

// 마지막 카드가 보이면 다음 데이터 호출
const observer = new IntersectionObserver(
    (entries) => {
        const lastEntry = entries[0];
        if (lastEntry.isIntersecting && !isLoading) {
            observer.unobserve(lastEntry.target);
            fetchComments();
        }
    }
);

// 댓글 불러오기 함수
async function fetchComments() {

    if (isLoading) {
        return;
    }
    isLoading = true;

    const params = new URLSearchParams(window.location.search);
    postId = params.get("id");

    try {
        let url = `http://localhost:8080/posts/${postId}/comments`;

        if (lastCommentCreatedAt && lastCommentId) {
            const formattedDate = lastCommentCreatedAt.replace(" ", "T");
            url += `?lastCommentCreatedAt=${formattedDate}&lastCommentId=${lastCommentId}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("댓글을 불러오지 못했습니다.");
        }
        
        const data = await response.json();
        const comments = data.data.comments;

        if (!comments || comments.length === 0) {
            return;
        }

        renderComments(comments);

        lastCommentCreatedAt = data.data.last_comment_created_at;
        lastCommentId = data.data.last_comment_id;

        if (commentList.lastElementChild) {
            observer.observe(commentList.lastElementChild);
        } 
    } catch (err) {
        alert("댓글 목록 조회 중 오류가 발생했습니다.")
    } finally {
        isLoading = false;
    }
}

// 댓글 렌더링 함수
function renderComments(comments) {

    comments.forEach(comment => {
        const card = document.createElement("div");
        card.classList.add("comment-card");

        card.innerHTML = `
            <div class="comment-header">
                <img class="comment-author-profile" src="${comment.profile_image || '../assets/default-profile.png'}" alt="profile" />
                <span class="comment-author">${comment.nickname }</span>
                <span class="comment-date">${comment.created_at?.replace("T", " ")}</span>
            </div>
            <p class="comment-text">${comment.content}</p>
            <div class="comment-actions">
                <button class="edit-comment-btn" data-id="${comment.comment_id}">수정</button>
                <button class="delete-comment-btn" data-id="${comment.comment_id}">삭제</button>
            </div>
        `;

        commentList.appendChild(card);
    });

    // 마지막 게시글 요소에 옵저버 붙이기
    const lastCard = commentList.lastElementChild;
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

// 전체 초기화 함수
async function initPostPage() {
    const params = new URLSearchParams(window.location.search);
    postId = params.get("id");

    if (!postId) {
      alert("잘못된 접근입니다.");
      // window.location.href = "posts.html";

      return;
    }

    try {
        const post = await fetchPostData(postId);
        renderPost(post);
    } catch (err) {
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
  }
}

// 게시글 수정
editBtn.addEventListener("click", () => {

    const params = new URLSearchParams(window.location.search);
    postId = params.get("id");

    if (!postId) {
        alert("잘못된 접근입니다.");
        return;
    }

    window.location.href = `edit-post.html?id=${postId}`;
});

// 게시글 삭제
deleteBtn.addEventListener("click", () => {
    postDeleteModal.classList.remove("hidden");
});

cancelPostDelete.addEventListener("click", () => {
    postDeleteModal.classList.add("hidden");
});

confirmPostDelete.addEventListener("click", async () => {

    const params = new URLSearchParams(window.location.search);
    postId = params.get("id");

    try {
        const response = await fetch(`http://localhost:8080/posts/${postId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("게시글 삭제 실패");
    }

    postDeleteModal.classList.add("hidden");
    postDeleteCompleteModal.classList.remove("hidden");
    } catch (err) {
        alert("게시글 삭제 중 오류가 발생했습니다.");
  }
});

postDeleteCompleteBtn.addEventListener("click", () => {
    postDeleteCompleteModal.classList.add("hidden");
    window.location.href = "posts.html";
});

// 댓글 입력 버튼
commentInput.addEventListener("input", () => {
    const trimmed = commentInput.value.trim();
    submitComment.disabled = trimmed.length === 0;
});

// 댓글 등록
submitComment.addEventListener("click", async () => {
    const content = commentInput.value;
    if (!content) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    postId = params.get("id");

    try {
        const response = await fetch(`http://localhost:8080/posts/${postId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        });

    if (!response.ok) {
      throw new Error("댓글 등록 실패");
    }

    renderComments([content]);

    const text = commentsCount.textContent;
    const num = parseInt(text.replace(/\D/g, ""), 10);
    commentsCount.textContent = `${num + 1} 댓글`;

    // 입력창 초기화
    commentInput.value = "";
    submitComment.disabled = true;

    } catch (err) {
        alert("댓글 등록 중 오류가 발생했습니다.");
    }
});


// // 좋아요
// likeBtn.addEventListener("click", async () => {
//     const params = new URLSearchParams(window.location.search);
//     postId = params.get("id");

//     try {
//         const response = await fetch(`http://localhost:8080/posts/${postId}/likes`, {
//             method: "PATCH",
//         });

//     if (!response.ok) {
//         throw new Error("좋아요 요청 실패");
//     }

//     const data = await response.json();
//     const updatedLikeCount = data.data.like_count; // 백엔드 응답 구조에 맞게 조정

//     // UI 업데이트
//     likeBtn.textContent = `${updatedLikeCount} 좋아요`;

//   } catch (err) {
//     alert("좋아요 처리 중 오류가 발생했습니다.");
//   }
// });


// 댓글 삭제 버튼 클릭
commentList.addEventListener("click", (e) => {
    if (e.target.classList.contains("comment-delete")) {
        commentId = e.target.dataset.id;
        commentElement = e.target.closest(".comment-card");
        commentDeleteModal.classList.remove("hidden");
  }
});

// 댓글 삭제 취소
cancelCommentDelete.addEventListener("click", () => {
    commentDeleteModal.classList.add("hidden");
    commentId = null;
    commentElement = null;
});

// 댓글 삭제 확인
confirmCommentDelete.addEventListener("click", async () => {

    const params = new URLSearchParams(window.location.search);
    postId = params.get("id");

    try {
        const response = await fetch(`http://localhost:8080/posts/${postId}/comments/${commentId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("댓글 삭제 실패");
        }

        commentDeleteModal.classList.add("hidden");
        commentDeleteCompleteModal.classList.remove("hidden");

    } catch (err) {
        alert("댓글 삭제 중 오류가 발생했습니다.");
    }
});

// 화면에서 댓글 삭제
commentDeleteCompleteBtn.addEventListener("click", () => {
    commentDeleteCompleteModal.classList.add("hidden");

    if (targetCommentElement) {
        targetCommentElement.remove();
    }

    const text = commentsCount.textContent;
    const num = parseInt(text.replace(/\D/g, ""), 10);
    commentsCount.textContent = `${Math.max(num - 1, 0)} 댓글수`;

    targetCommentId = null;
    targetCommentElement = null;
});

// 댓글 수정 버튼 클릭
commentList.addEventListener("click", (e) => {

    const btn = e.target.closest("button"); // ✅ 클릭된 요소가 자식이어도 버튼으로 인식
    if (!btn) {
        return;
    }

    if (e.target.classList.contains("edit-comment-btn")) {
        const commentCard = e.target.closest(".comment-card");
        const commentId = e.target.dataset.id;
        const commentTextElement = commentCard.querySelector(".comment-text");
        const commentActions = commentCard.querySelector(".comment-actions");

        // 중복 방지
        if (commentCard.classList.contains("editing")) {
            return;
        }
        commentCard.classList.add("editing");

        const originalText = commentTextElement.textContent;

        const textarea = document.createElement("textarea");
        textarea.value = originalText;
        textarea.classList.add("comment-edit-input");
        commentTextElement.replaceWith(textarea);

        commentActions.innerHTML = `
            <button class="save-comment-btn" data-id="${commentId}">완료</button>
            <button class="cancel-comment-btn" data-id="${commentId}">취소</button>
        `;

        const saveBtn = commentActions.querySelector(".save-comment-btn");

        saveBtn.disabled = textarea.value.trim().length === 0;
        textarea.addEventListener("input", () => {
            const trimmed = textarea.value.trim();
            saveBtn.disabled = trimmed.length === 0;
        });
    }

    // 수정 취소
    if (e.target.classList.contains("cancel-comment-btn")) {
        const commentCard = e.target.closest(".comment-card");
        const commentId = e.target.dataset.id;
        const textarea = commentCard.querySelector(".comment-edit-input");
        const commentActions = commentCard.querySelector(".comment-actions");

        const originalText = textarea.value;
        const commentTextEl = document.createElement("p");
        commentTextEl.classList.add("comment-text");
        commentTextEl.textContent = originalText;
        textarea.replaceWith(commentTextEl);

        commentActions.innerHTML = `
            <button class="edit-comment-btn" data-id="${commentId}">수정</button>
            <button class="delete-comment-btn" data-id="${commentId}">삭제</button>
            `;

        commentCard.classList.remove("editing");
    }

    // 수정 완료
    if (e.target.classList.contains("save-comment-btn")) {
        const commentCard = e.target.closest(".comment-card");
        const commentId = e.target.dataset.id;
        const textarea = commentCard.querySelector(".comment-edit-input");
        const newContent = textarea.value;

        if (!newContent) {
            alert("댓글 내용을 입력해주세요!");
            return;
        }

        updateComment(commentId, newContent, commentCard);
    }
});

// 댓글 수정 API 요청
async function updateComment(commentId, newContent, commentCard) {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("id");

    try {
        const response = await fetch(`http://localhost:8080/posts/${postId}/comments/${commentId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newContent }),
    });

    if (!response.ok) {
      throw new Error("댓글 수정 실패");
    }

    // 성공 시 화면 갱신
    const commentActions = commentCard.querySelector(".comment-actions");
    const textarea = commentCard.querySelector(".comment-edit-input");

    const newP = document.createElement("p");
    newP.classList.add("comment-text");
    newP.textContent = newContent;

    textarea.replaceWith(newP);
    commentActions.innerHTML = `
        <button class="edit-comment-btn" data-id="${commentId}">수정</button>
        <button class="delete-comment-btn" data-id="${commentId}">삭제</button>
    `;
    commentCard.classList.remove("editing");

    } catch (err) {
        alert("댓글 수정 중 오류가 발생했습니다.");
    }
}


// 실행
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadUserProfile();
        await initPostPage();
        await fetchComments();
    } catch (err) {
        alert("페이지를 불러오는 중 오류가 발생했습니다.");
    }
});
