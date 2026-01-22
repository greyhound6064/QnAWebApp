// ========== 유틸 ==========
function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== 1. 초기화 및 인증 상태 ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof _supabase === 'undefined' || _supabase === null) {
            throw new Error('Supabase 클라이언트가 로드되지 않았습니다. supabase-config.js를 확인하세요.');
        }

        bindLoginButton();

        if (isOAuthReturn()) {
            await new Promise(function (r) { setTimeout(r, 100); });
        }
        const { data: { session } } = await _supabase.auth.getSession();
        updateAuthUI(session);
        await renderPosts();
        clearOAuthHash();
    } catch (err) {
        console.error('초기화 에러:', err);
        alert('앱 초기화 중 오류가 발생했습니다: ' + err.message);
    }
});

function isOAuthReturn() {
    var h = window.location.hash || '';
    var q = window.location.search || '';
    return /access_token|refresh_token|code=/.test(h + q);
}

function clearOAuthHash() {
    if (!isOAuthReturn()) return;
    try {
        var u = new URL(window.location.href);
        u.hash = '';
        u.search = '';
        history.replaceState(null, '', u.pathname + (u.pathname.endsWith('/') ? '' : '/'));
    } catch (e) {}
}

function bindLoginButton() {
    var btn = document.getElementById('btn-login');
    if (!btn) return;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function () {
        if (typeof signInWithGoogle === 'function') signInWithGoogle();
    });
}

if (typeof _supabase !== 'undefined' && _supabase) {
    _supabase.auth.onAuthStateChange(function (event, session) {
        updateAuthUI(session);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') renderPosts();
    });
}

function updateAuthUI(session) {
    var loginBtn = document.getElementById('btn-login');
    var userInfo = document.getElementById('user-info');
    var userEmail = document.getElementById('user-email');
    if (session && session.user) {
        if (loginBtn) { loginBtn.style.display = 'none'; loginBtn.disabled = false; loginBtn.textContent = '구글 로그인'; }
        if (userInfo) userInfo.style.display = 'flex';
        if (userEmail) userEmail.textContent = session.user.email || '이메일 없음';
    } else {
        if (loginBtn) { loginBtn.style.display = 'inline-flex'; loginBtn.disabled = false; loginBtn.textContent = '구글 로그인'; }
        if (userInfo) userInfo.style.display = 'none';
    }
}

// ========== 2. 구글 로그인 / 로그아웃 ==========
async function signInWithGoogle() {
    var btn = document.getElementById('btn-login');
    try {
        if (typeof _supabase === 'undefined' || !_supabase) {
            alert('Supabase가 로드되지 않았습니다.');
            return;
        }
        var scheme = (window.location.protocol || '').toLowerCase();
        if (!scheme.startsWith('http')) {
            alert('OAuth는 http(s) 환경에서만 동작합니다. 로컬 서버(localhost)로 실행해 주세요.');
            return;
        }
        if (btn) { btn.disabled = true; btn.textContent = '이동 중...'; }

        var base = window.location.origin;
        var path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
        var redirectTo = base + path + (path.endsWith('/') ? '' : '/');

        var res = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectTo }
        });

        if (res.error) {
            alert('구글 로그인 실패: ' + res.error.message);
            return;
        }
        if (res.data && res.data.url) {
            window.location.href = res.data.url;
        } else {
            alert('로그인 URL을 받지 못했습니다. Supabase 대시보드에서 Google Provider 설정을 확인해 주세요.');
        }
    } catch (err) {
        console.error('구글 로그인 예외:', err);
        alert('구글 로그인 중 오류: ' + (err.message || String(err)));
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '구글 로그인'; }
    }
}

window.signInWithGoogle = signInWithGoogle;

async function signOut() {
    try {
        var res = await _supabase.auth.signOut();
        if (res && res.error) {
            alert('로그아웃 실패: ' + res.error.message);
            return;
        }
        window.location.reload();
    } catch (err) {
        console.error('로그아웃 예외:', err);
        alert('로그아웃 중 오류가 발생했습니다.');
    }
}

// ========== 3. 게시물 ==========
async function addPost() {
    var titleInput = document.getElementById('post-title');
    var contentInput = document.getElementById('post-content');
    var btn = document.querySelector('.post-form button');
    if (!titleInput || !contentInput) return;
    var title = titleInput.value.trim();
    var content = contentInput.value.trim();
    if (!title || !content) {
        alert('제목과 내용을 모두 입력해 주세요.');
        return;
    }
    try {
        var userRes = await _supabase.auth.getUser();
        var user = userRes.data && userRes.data.user;
        if (userRes.error || !user) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (btn) { btn.disabled = true; btn.textContent = '업로드 중...'; }
        var ins = await _supabase.from('posts').insert([{
            title: title,
            content: content,
            author_email: user.email,
            user_id: user.id
        }]);
        if (ins.error) {
            alert('게시물 업로드 실패: ' + ins.error.message);
            return;
        }
        titleInput.value = '';
        contentInput.value = '';
        await renderPosts();
    } catch (err) {
        console.error('게시물 업로드 예외:', err);
        alert('게시물 업로드 중 오류: ' + (err.message || String(err)));
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '게시물 업로드'; }
    }
}

async function deletePost(postId) {
    if (!confirm('이 게시물을 삭제할까요?')) return;
    try {
        var r = await _supabase.from('posts').delete().eq('id', postId);
        if (r.error) {
            alert('삭제 실패: ' + r.error.message);
            return;
        }
        await renderPosts();
    } catch (err) {
        console.error('게시물 삭제 예외:', err);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

// ========== 4. 댓글 ==========
async function addComment(postId) {
    var input = document.getElementById('comment-input-' + postId);
    if (!input) return;
    var content = (input.value || '').trim();
    if (!content) return;
    try {
        var userRes = await _supabase.auth.getUser();
        var user = userRes.data && userRes.data.user;
        if (userRes.error || !user) {
            alert('로그인 후 댓글을 작성할 수 있습니다.');
            return;
        }
        var ins = await _supabase.from('comments').insert([{
            post_id: postId,
            content: content,
            author_email: user.email
        }]);
        if (ins.error) {
            alert('댓글 등록 실패: ' + ins.error.message);
            return;
        }
        input.value = '';
        await renderPosts();
    } catch (err) {
        console.error('댓글 등록 예외:', err);
        alert('댓글 등록 중 오류: ' + (err.message || String(err)));
    }
}

async function deleteComment(commentId) {
    if (!confirm('댓글을 삭제할까요?')) return;
    try {
        var r = await _supabase.from('comments').delete().eq('id', commentId);
        if (r.error) {
            alert('댓글 삭제 실패: ' + r.error.message);
            return;
        }
        await renderPosts();
    } catch (err) {
        console.error('댓글 삭제 예외:', err);
        alert('댓글 삭제 중 오류가 발생했습니다.');
    }
}

// ========== 5. 게시물 목록 렌더링 ==========
async function renderPosts() {
    var postList = document.getElementById('post-list');
    if (!postList) return;
    try {
        var res = await _supabase.from('posts').select('*, comments(*)').order('created_at', { ascending: false });
        if (res.error) {
            postList.innerHTML = '<p class="error-msg">게시물을 불러올 수 없습니다. ' + escapeHtml(res.error.message) + '</p>';
            return;
        }
        var posts = res.data;
        if (!posts || posts.length === 0) {
            postList.innerHTML = '<p class="empty-msg">아직 게시물이 없습니다.</p>';
            return;
        }
        postList.innerHTML = posts.map(function (post) {
            var title = escapeHtml(post.title);
            var body = escapeHtml(post.content);
            var author = escapeHtml(post.author_email || '');
            var createdAt = post.created_at ? new Date(post.created_at).toLocaleString('ko-KR') : '';
            var comments = Array.isArray(post.comments) ? post.comments : [];
            var commentLis = comments.map(function (c) {
                var cAuthor = (c.author_email || '').split('@')[0] || '알 수 없음';
                var cContent = escapeHtml(c.content || '');
                return '<li class="comment-item">' +
                    '<span><strong>' + escapeHtml(cAuthor) + ':</strong> ' + cContent + '</span>' +
                    '<button type="button" class="delete-comment-btn" onclick="deleteComment(' + Number(c.id) + ')">삭제</button></li>';
            }).join('');
            return '<div class="post-card">' +
                '<div class="post-header">' +
                '<h3>' + title + '</h3>' +
                '<button type="button" class="delete-btn" onclick="deletePost(' + Number(post.id) + ')">삭제</button>' +
                '</div><p>' + body + '</p>' +
                '<small>작성자: ' + author + ' | ' + createdAt + '</small>' +
                '<div class="comment-section">' +
                '<ul class="comment-list">' + commentLis + '</ul>' +
                '<div class="comment-input-group">' +
                '<input type="text" id="comment-input-' + post.id + '" placeholder="댓글을 입력하세요" />' +
                '<button type="button" onclick="addComment(' + post.id + ')">등록</button>' +
                '</div></div></div>';
        }).join('');
    } catch (err) {
        console.error('게시물 렌더링 예외:', err);
        postList.innerHTML = '<p class="error-msg">게시물을 불러오는 중 오류가 발생했습니다.</p>';
    }
}
