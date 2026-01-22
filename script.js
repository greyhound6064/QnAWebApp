// 1. 초기화 및 상태 감지
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 초기 세션 확인
        const { data: { session }, error } = await _supabase.auth.getSession();
        if (error) {
            console.error('세션 확인 에러:', error);
        }

        // UI 초기화
        updateAuthUI(session);

        // 게시물 렌더링
        await renderPosts();
    } catch (error) {
        console.error('초기화 에러:', error);
        alert('앱 초기화 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
    }
});

// 인증 상태 변경 감지
_supabase.auth.onAuthStateChange((event, session) => {
    console.log('인증 상태 변경:', event, session ? '로그인됨' : '로그아웃됨');
    updateAuthUI(session);

    if (event === 'SIGNED_IN') {
        console.log('사용자 로그인 성공');
    } else if (event === 'SIGNED_OUT') {
        console.log('사용자 로그아웃');
    }
});

// UI 업데이트 함수
function updateAuthUI(session) {
    const loginBtn = document.getElementById('btn-login');
    const userInfo = document.getElementById('user-info');
    const userEmail = document.getElementById('user-email');

    if (session && session.user) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'block';
        if (userEmail) userEmail.innerText = session.user.email || '이메일 정보 없음';
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// 2. 인증 관련 함수
async function signInWithGoogle() {
    const { data, error } = await _supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
            scopes: 'email profile'
        }
    });

    if (error) {
        console.error('OAuth 로그인 에러:', error);
        alert('구글 로그인 실패: ' + error.message);
    } else {
        console.log('OAuth 로그인 성공:', data);
    }
}

async function signOut() {
    try {
        const { error } = await _supabase.auth.signOut();
        if (error) {
            console.error('로그아웃 에러:', error);
            alert('로그아웃 중 오류가 발생했습니다: ' + error.message);
        } else {
            console.log('로그아웃 성공');
            window.location.reload();
        }
    } catch (error) {
        console.error('로그아웃 처리 중 예외 발생:', error);
        alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
}

// 3. 게시물 관련 함수 (Supabase)
async function addPost() {
    const titleInput = document.getElementById('post-title');
    const contentInput = document.getElementById('post-content');
    
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    if (!titleInput.value || !contentInput.value) {
        return alert("제목과 내용을 입력해주세요.");
    }

    const { error } = await _supabase
        .from('posts')
        .insert([{ 
            title: titleInput.value, 
            content: contentInput.value, 
            author_email: user.email,
            user_id: user.id // 보안 및 식별을 위해 ID 저장 권장
        }]);

    if (!error) {
        titleInput.value = '';
        contentInput.value = '';
        renderPosts();
    } else {
        console.error('Error adding post:', error.message);
    }
}

async function deletePost(postId) {
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;

    const { error } = await _supabase
        .from('posts')
        .delete()
        .eq('id', postId);

    if (!error) {
        renderPosts();
    } else {
        alert('삭제 권한이 없거나 오류가 발생했습니다.');
    }
}

// 4. 댓글 관련 함수 (Supabase)
async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const { data: { user } } = await _supabase.auth.getUser();

    if (!user) return alert("로그인 후 댓글을 작성할 수 있습니다.");
    if (!commentInput.value) return;

    const { error } = await _supabase
        .from('comments')
        .insert([{ 
            post_id: postId, 
            content: commentInput.value, 
            author_email: user.email 
        }]);

    if (!error) {
        commentInput.value = '';
        renderPosts();
    }
}

async function deleteComment(commentId) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    const { error } = await _supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (!error) renderPosts();
}

// 5. 렌더링 함수
async function renderPosts() {
    const { data: posts, error } = await _supabase
        .from('posts')
        .select(`*, comments(*)`)
        .order('created_at', { ascending: false });

    if (error) return console.error('Error fetching posts:', error.message);

    const postList = document.getElementById('post-list');
    postList.innerHTML = posts.map(post => `
        <div class="post-card">
            <div class="post-header">
                <h3>${post.title}</h3>
                <button class="delete-btn" onclick="deletePost(${post.id})">🗑️</button>
            </div>
            <p>${post.content}</p>
            <small>작성자: ${post.author_email} | ${new Date(post.created_at).toLocaleString()}</small>

            <div class="comment-section">
                <ul class="comment-list">
                    ${post.comments ? post.comments.map(comment => `
                        <li class="comment-item">
                            <span><strong>${comment.author_email.split('@')[0]}:</strong> ${comment.content}</span>
                            <button class="delete-comment-btn" onclick="deleteComment(${comment.id})">❌</button>
                        </li>
                    `).join('') : ''}
                </ul>
                <div class="comment-input-group">
                    <input type="text" id="comment-input-${post.id}" placeholder="댓글을 입력하세요">
                    <button onclick="addComment(${post.id})">등록</button>
                </div>
            </div>
        </div>
    `).join('');
}