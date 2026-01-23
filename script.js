// ========== 유틸 ==========
function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== 탭 전환 ==========
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentTabTitle = document.getElementById('current-tab-title');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 모든 탭 버튼의 active 클래스 제거
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 모든 탭 콘텐츠 숨기기
            tabContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // 선택한 탭 콘텐츠 표시
            const targetContent = document.getElementById(targetTab + '-tab-content');
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
                
                // 프로필 탭이 활성화되면 프로필 정보 업데이트
                if (targetTab === 'profile') {
                    updateProfileInfo();
                    if (currentTabTitle) currentTabTitle.style.display = 'none';
                } else {
                    if (currentTabTitle) currentTabTitle.style.display = 'block';
                }
            }
            
            // 타이틀 업데이트
            if (currentTabTitle && targetTab !== 'profile') {
                const tabNames = {
                    'feed': '피드',
                    'community': '커뮤니티'
                };
                currentTabTitle.textContent = tabNames[targetTab] || '프로필';
            }
        });
    });
    
    // 프로필 페이지 내부 탭 초기화
    initProfileTabs();
}

// ========== 프로필 페이지 내부 탭 전환 ==========
function initProfileTabs() {
    const profileTabs = document.querySelectorAll('.profile-tab');
    
    profileTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-profile-tab');
            
            // 모든 프로필 탭 버튼의 active 클래스 제거
            profileTabs.forEach(btn => btn.classList.remove('active'));
            // 클릭한 탭 버튼에 active 클래스 추가
            this.classList.add('active');
            
            // 모든 프로필 탭 콘텐츠 숨기기
            const profileContents = document.querySelectorAll('.profile-tab-content');
            profileContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // 선택한 탭 콘텐츠 표시
            const targetContent = document.getElementById('profile-' + targetTab + '-content');
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');
            }
        });
    });
}

// ========== 프로필 정보 업데이트 ==========
async function updateProfileInfo() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        const logoutBtn = document.getElementById('profile-logout-btn');
        
        if (session && session.user) {
            const user = session.user;
            const userId = user.id;
            
            // profiles 테이블에서 프로필 정보 가져오기
            const { data: profile, error: profileError } = await _supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            
            if (profileError && profileError.code !== 'PGRST116') {
                console.error('프로필 조회 에러:', profileError);
            }
            
            const email = user.email || '';
            const nickname = profile?.nickname || email.split('@')[0] || '사용자';
            const bio = profile?.bio || '';
            const avatarUrl = profile?.avatar_url || null;
            
            // 닉네임 업데이트
            const usernameEl = document.getElementById('profile-username');
            if (usernameEl) usernameEl.textContent = nickname;
            
            // 소개 업데이트
            const bioEl = document.getElementById('profile-bio');
            if (bioEl) bioEl.textContent = bio || '소개글이 아직 없습니다.';
            
            // 프로필 아바타 업데이트
            updateProfileAvatar(avatarUrl);
            
            // 로그아웃 버튼 표시
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            // 게시물 통계 업데이트
            await updateProfileStats();
        } else {
            // 로그인하지 않은 경우 기본값 표시
            const usernameEl = document.getElementById('profile-username');
            if (usernameEl) usernameEl.textContent = '로그인이 필요합니다';
            
            const bioEl = document.getElementById('profile-bio');
            if (bioEl) bioEl.textContent = '구글 계정으로 로그인하여 프로필을 확인하세요';
            
            // 프로필 아바타 초기화
            updateProfileAvatar(null);
            
            // 로그아웃 버튼 숨김
            if (logoutBtn) logoutBtn.style.display = 'none';
            
            // 통계 초기화
            const postsStatEl = document.getElementById('stat-posts');
            if (postsStatEl) postsStatEl.textContent = '0';
            
            const followersStatEl = document.getElementById('stat-followers');
            if (followersStatEl) followersStatEl.textContent = '0';
            
            const followingStatEl = document.getElementById('stat-following');
            if (followingStatEl) followingStatEl.textContent = '0';
        }
    } catch (err) {
        console.error('프로필 정보 업데이트 에러:', err);
    }
}

// ========== 프로필 통계 업데이트 ==========
async function updateProfileStats() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            return;
        }
        
        // 게시물 수 가져오기
        const { data: posts, error: postsError } = await _supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id);
        
        const postsCount = postsError ? 0 : (posts?.length || 0);
        
        // 통계 업데이트
        const postsStatEl = document.getElementById('stat-posts');
        if (postsStatEl) postsStatEl.textContent = postsCount;
        
        // 팔로워/팔로우는 임시로 0으로 설정 (추후 구현 가능)
        const followersStatEl = document.getElementById('stat-followers');
        if (followersStatEl) followersStatEl.textContent = '0';
        
        const followingStatEl = document.getElementById('stat-following');
        if (followingStatEl) followingStatEl.textContent = '0';
    } catch (err) {
        console.error('프로필 통계 업데이트 에러:', err);
    }
}

// ========== 1. 초기화 및 인증 상태 ==========
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (typeof _supabase === 'undefined' || _supabase === null) {
            throw new Error('Supabase 클라이언트가 로드되지 않았습니다. supabase-config.js를 확인하세요.');
        }

        bindLoginButton();
        initTabs(); // 탭 전환 기능 초기화

        if (isOAuthReturn()) {
            await new Promise(function (r) { setTimeout(r, 100); });
        }
        const { data: { session } } = await _supabase.auth.getSession();
        updateAuthUI(session);
        await updateProfileInfo(); // 프로필 정보 업데이트
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
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            updateProfileInfo();
            renderPosts();
        }
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
        console.log('구글 로그인 시작...');

        if (typeof _supabase === 'undefined' || !_supabase) {
            alert('Supabase가 로드되지 않았습니다.');
            console.error('Supabase가 로드되지 않음');
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

        console.log('리다이렉트 URL:', redirectTo);

        var res = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });

        console.log('OAuth 응답:', res);

        if (res.error) {
            console.error('OAuth 에러:', res.error);
            alert('구글 로그인 실패: ' + res.error.message);
            return;
        }

        if (res.data && res.data.url) {
            console.log('OAuth URL로 이동:', res.data.url);
            window.location.href = res.data.url;
        } else {
            console.error('OAuth URL을 받지 못함:', res);
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

// 프로필 탭에서 로그아웃 처리
async function handleProfileLogout() {
    try {
        if (!confirm('로그아웃 하시겠습니까?')) {
            return;
        }
        
        var btn = document.getElementById('profile-logout-btn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '로그아웃 중...';
        }
        
        var res = await _supabase.auth.signOut();
        if (res && res.error) {
            alert('로그아웃 실패: ' + res.error.message);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '로그아웃';
            }
            return;
        }
        
        // 로그아웃 후 페이지 새로고침
        window.location.reload();
    } catch (err) {
        console.error('로그아웃 예외:', err);
        alert('로그아웃 중 오류가 발생했습니다.');
        var btn = document.getElementById('profile-logout-btn');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '로그아웃';
        }
    }
}

window.handleProfileLogout = handleProfileLogout;

// ========== 프로필 편집 ==========
let selectedAvatarFile = null;
let currentAvatarUrl = null;

// 프로필 편집 모달 열기
function openProfileEditModal() {
    const modal = document.getElementById('profile-edit-modal');
    if (!modal) return;
    
    // 현재 프로필 정보 로드
    loadCurrentProfileData();
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', handleModalEscape);
    
    // 모달 배경 클릭 시 닫기
    modal.addEventListener('click', handleModalBackgroundClick);
}

// ESC 키 처리
function handleModalEscape(e) {
    if (e.key === 'Escape') {
        closeProfileEditModal();
    }
}

// 모달 배경 클릭 처리
function handleModalBackgroundClick(e) {
    const modal = document.getElementById('profile-edit-modal');
    if (e.target === modal) {
        closeProfileEditModal();
    }
}

// 프로필 편집 모달 닫기
function closeProfileEditModal() {
    const modal = document.getElementById('profile-edit-modal');
    if (!modal) return;
    
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // 이벤트 리스너 제거
    document.removeEventListener('keydown', handleModalEscape);
    modal.removeEventListener('click', handleModalBackgroundClick);
    
    // 선택된 파일 초기화
    selectedAvatarFile = null;
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
}

// 현재 프로필 데이터 로드
async function loadCurrentProfileData() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            closeProfileEditModal();
            return;
        }
        
        const user = session.user;
        const userId = user.id;
        const email = user.email || '';
        const username = email.split('@')[0] || '';
        
        // profiles 테이블에서 프로필 정보 가져오기
        const { data: profile, error: profileError } = await _supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') {
            console.error('프로필 조회 에러:', profileError);
        }
        
        const nickname = profile?.nickname || username;
        const bio = profile?.bio || '';
        const avatarUrl = profile?.avatar_url || null;
        
        // 닉네임 필드 설정
        const nicknameInput = document.getElementById('edit-nickname');
        if (nicknameInput) nicknameInput.value = nickname;
        
        // 소개 필드 설정
        const bioInput = document.getElementById('edit-bio');
        if (bioInput) bioInput.value = bio;
        
        // 아바타 미리보기 설정
        currentAvatarUrl = avatarUrl;
        updateAvatarPreview(avatarUrl);
        
    } catch (err) {
        console.error('프로필 데이터 로드 에러:', err);
    }
}

// 아바타 미리보기 업데이트
function updateAvatarPreview(imageUrl) {
    const preview = document.getElementById('edit-avatar-preview');
    if (!preview) return;
    
    if (imageUrl) {
        preview.innerHTML = `<img src="${imageUrl}" alt="프로필 이미지">`;
    } else {
        preview.innerHTML = `
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }
}

// 아바타 파일 선택 처리
function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
    }
    
    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
    }
    
    selectedAvatarFile = file;
    
    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(e) {
        updateAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 아바타 삭제
async function removeAvatar() {
    if (!confirm('프로필 사진을 삭제하시겠습니까?')) {
        return;
    }
    
    // Storage에서 기존 이미지 삭제
    if (currentAvatarUrl) {
        try {
            const fileName = currentAvatarUrl.split('/').pop().split('?')[0];
            await _supabase.storage
                .from('avatars')
                .remove([fileName]);
            console.log('Storage에서 이미지 삭제:', fileName);
        } catch (err) {
            console.error('이미지 삭제 에러:', err);
        }
    }
    
    selectedAvatarFile = null;
    currentAvatarUrl = null;
    updateAvatarPreview(null);
    
    const fileInput = document.getElementById('avatar-upload');
    if (fileInput) fileInput.value = '';
}

// 프로필 변경사항 저장
async function saveProfileChanges() {
    try {
        const { data: { session } } = await _supabase.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            return;
        }
        
        const userId = session.user.id;
        const nicknameInput = document.getElementById('edit-nickname');
        const bioInput = document.getElementById('edit-bio');
        const saveBtn = document.querySelector('.modal-btn.save');
        
        const nickname = nicknameInput ? nicknameInput.value.trim() : '';
        const bio = bioInput ? bioInput.value.trim() : '';
        
        if (!nickname) {
            alert('닉네임을 입력해주세요.');
            return;
        }
        
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = '저장 중...';
        }
        
        let avatarUrl = currentAvatarUrl;
        
        // 새 이미지가 선택된 경우 Supabase Storage에 업로드
        if (selectedAvatarFile) {
            try {
                const fileExt = selectedAvatarFile.name.split('.').pop();
                const fileName = `${userId}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;
                
                console.log('이미지 업로드 시작:', filePath);
                
                // 기존 아바타가 있으면 삭제
                if (currentAvatarUrl) {
                    try {
                        const oldFileName = currentAvatarUrl.split('/').pop().split('?')[0];
                        await _supabase.storage
                            .from('avatars')
                            .remove([oldFileName]);
                        console.log('기존 이미지 삭제:', oldFileName);
                    } catch (deleteErr) {
                        console.log('기존 이미지 삭제 실패 (무시):', deleteErr);
                    }
                }
                
                // Supabase Storage에 업로드
                const { data: uploadData, error: uploadError } = await _supabase.storage
                    .from('avatars')
                    .upload(filePath, selectedAvatarFile, {
                        cacheControl: '3600',
                        upsert: true
                    });
                
                if (uploadError) {
                    console.error('이미지 업로드 에러:', uploadError);
                    throw uploadError;
                }
                
                console.log('이미지 업로드 성공:', uploadData);
                
                // 공개 URL 가져오기
                const { data: urlData } = _supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                avatarUrl = urlData.publicUrl;
                console.log('공개 URL 생성:', avatarUrl);
                
            } catch (err) {
                console.error('이미지 업로드 처리 에러:', err);
                alert('이미지 업로드 중 오류가 발생했습니다: ' + err.message);
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = '저장';
                }
                return;
            }
        }
        
        // profiles 테이블에 프로필 정보 저장 (upsert)
        const { data: profileData, error: profileError } = await _supabase
            .from('profiles')
            .upsert({
                user_id: userId,
                nickname: nickname,
                bio: bio,
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();
        
        if (profileError) {
            console.error('프로필 업데이트 에러:', profileError);
            alert('프로필 업데이트에 실패했습니다: ' + profileError.message);
            return;
        }
        
        console.log('프로필 저장 성공:', profileData);
        
        // user_metadata에도 저장 (호환성)
        await _supabase.auth.updateUser({
            data: {
                nickname: nickname,
                bio: bio
            }
        });
        
        alert('프로필이 성공적으로 업데이트되었습니다.');
        
        // 프로필 정보 새로고침
        await updateProfileInfo();
        
        // 모달 닫기
        closeProfileEditModal();
        
    } catch (err) {
        console.error('프로필 저장 예외:', err);
        alert('프로필 저장 중 오류가 발생했습니다: ' + (err.message || String(err)));
    } finally {
        const saveBtn = document.querySelector('.modal-btn.save');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = '저장';
        }
    }
}

// 프로필 아바타 업데이트
function updateProfileAvatar(avatarUrl) {
    const profileAvatar = document.getElementById('profile-avatar');
    if (!profileAvatar) return;
    
    if (avatarUrl) {
        profileAvatar.innerHTML = `<img src="${avatarUrl}" alt="프로필 이미지" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    } else {
        profileAvatar.innerHTML = `
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
    }
}

window.openProfileEditModal = openProfileEditModal;
window.closeProfileEditModal = closeProfileEditModal;
window.handleAvatarChange = handleAvatarChange;
window.removeAvatar = removeAvatar;
window.saveProfileChanges = saveProfileChanges;

// ========== 3. 게시물 ==========
async function addPost() {
    var titleInput = document.getElementById('post-title');
    var contentInput = document.getElementById('post-content-input');
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
        
        // profiles 테이블에서 닉네임 가져오기
        const { data: profile } = await _supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', user.id)
            .single();
        
        var nickname = profile?.nickname || user.email.split('@')[0] || '사용자';
        
        if (btn) { btn.disabled = true; btn.textContent = '업로드 중...'; }
        var ins = await _supabase.from('posts').insert([{
            title: title,
            content: content,
            author_email: user.email,
            author_nickname: nickname,
            user_id: user.id
        }]);
        if (ins.error) {
            alert('게시물 업로드 실패: ' + ins.error.message);
            return;
        }
        titleInput.value = '';
        contentInput.value = '';
        await renderPosts();
        await updateProfileStats(); // 프로필 통계 업데이트
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
        console.log('addComment: 댓글 내용', content);
        try {
            var userRes = await _supabase.auth.getUser();
            var user = userRes.data && userRes.data.user;
            console.log('addComment: 현재 사용자 정보', user);
            if (userRes.error || !user) {
            alert('로그인 후 댓글을 작성할 수 있습니다.');
            return;
        }
        
        // profiles 테이블에서 닉네임 가져오기
        const { data: profile } = await _supabase
            .from('profiles')
            .select('nickname')
            .eq('user_id', user.id)
            .single();
        
        var nickname = profile?.nickname || user.email.split('@')[0] || '사용자';
        
        var ins = await _supabase.from('comments').insert([{
            post_id: postId,
            content: content,
            author_email: user.email,
            author_nickname: nickname,
            user_id: user.id
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
        var currentUser = await _supabase.auth.getUser();
        var currentUserId = currentUser.data.user ? currentUser.data.user.id : null;

        if (!posts || posts.length === 0) {
            postList.innerHTML = '<p class="empty-msg">아직 게시물이 없습니다.</p>';
            return;
        }
        postList.innerHTML = posts.map(function (post) {
            var title = escapeHtml(post.title);
            var body = escapeHtml(post.content);
            // 닉네임 우선 표시, 없으면 이메일에서 추출
            var author = escapeHtml(post.author_nickname || (post.author_email || '').split('@')[0] || '알 수 없음');
            var createdAt = post.created_at ? new Date(post.created_at).toLocaleString('ko-KR') : '';
            var comments = Array.isArray(post.comments) ? post.comments : [];
            var deleteButtonHtml = '';
            if (currentUserId && currentUserId === post.user_id) {
                deleteButtonHtml = '<button type="button" class="delete-btn" onclick="deletePost(\'' + (post.id != null ? post.id : '') + '\')">삭제</button>';
            }

            var commentLis = comments.map(function (c) {
                // 댓글도 닉네임 우선 표시
                var cAuthor = escapeHtml(c.author_nickname || (c.author_email || '').split('@')[0] || '알 수 없음');
                var cContent = escapeHtml(c.content || '');
                var deleteCommentButtonHtml = '';
                if (currentUserId && currentUserId === c.user_id) {
                    deleteCommentButtonHtml = '<button type="button" class="delete-comment-btn" onclick="deleteComment(\'' + (c.id != null ? c.id : '') + '\')">삭제</button>';
                }
                return '<li class="comment-item">' +
                    '<span><strong>' + cAuthor + ':</strong> ' + cContent + '</span>' +
                    deleteCommentButtonHtml + '</li>';
            }).join('');
            return '<div class="post-card">' +
                '<div class="post-header">' +
                '<h3 style="cursor: pointer;" onclick="togglePostContent(\'post-content-' + post.id + '\')">' + title + '</h3>' +
                deleteButtonHtml +
                '</div><p id="post-content-' + post.id + '\" class="post-content-hidden">' + body + '</p>' +
                '<small>작성자: ' + author + ' | ' + createdAt + '</small>' +
                '<div class="comment-section">' +
                '<ul class="comment-list">' + commentLis + '</ul>' +
                '<div class="comment-input-group">' +
                '<input type="text" id="comment-input-' + post.id + '" placeholder="댓글을 입력하세요" />' +
                '<button type="button" onclick="addComment(\'' + (post.id != null ? post.id : '') + '\')">등록</button>' +
                '</div></div></div>';
        }).join('');
    } catch (err) {
        console.error('게시물 렌더링 예외:', err);
        postList.innerHTML = '<p class="error-msg">게시물을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

function togglePostContent(contentId) {
    var contentElement = document.getElementById(contentId);
    if (contentElement) {
        contentElement.classList.toggle('post-content-hidden');
    }
}