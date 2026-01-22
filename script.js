// 페이지 로드 시 기존 게시물 불러오기
document.addEventListener('DOMContentLoaded', () => {
    renderPosts();
});

// 게시물 추가 함수
function addPost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;

    if (!title || !content) {
        alert("제목과 내용을 모두 입력해주세요.");
        return;
    }

    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const newPost = {
        id: Date.now(),
        title: title,
        content: content,
        comments: [],
        date: new Date().toLocaleString()
    };

    posts.unshift(newPost); // 최신글이 위로 오게 추가
    localStorage.setItem('posts', JSON.stringify(posts));

    // 입력창 초기화
    document.getElementById('post-title').value = '';
    document.getElementById('post-content').value = '';

    renderPosts();
}

// 댓글 추가 함수
function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const commentText = commentInput.value;

    if (!commentText) return;

    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);

    if (!error) {
        commentInput.value = '';
        renderPosts();
    }
}

// 화면에 게시물 렌더링
function renderPosts() {
    const postList = document.getElementById('post-list');
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');

    postList.innerHTML = posts.map(post => `
        <div class="post-card">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <small style="color: #888;">작성일: ${post.date}</small>

            <div class="comment-section">
                <ul class="comment-list">
                    ${post.comments.map(comment => `<li class="comment-item">${comment}</li>`).join('')}
                </ul>
                <div class="comment-input-group">
                    <input type="text" id="comment-input-${post.id}" placeholder="댓글을 입력하세요">
                    <button onclick="addComment(${post.id})">등록</button>
                </div>
            </div>
        </div>
    `).join('');
}