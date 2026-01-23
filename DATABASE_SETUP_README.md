# 📊 데이터베이스 설정 가이드

## 🎯 필요한 파일

### ✅ **SETUP_DATABASE.sql** (이것만 실행하면 됩니다!)

모든 테이블과 보안 정책이 포함된 **통합 설정 파일**입니다.

---

## 🚀 설정 방법

### 1단계: SQL 실행

1. **Supabase 대시보드** 접속
2. 왼쪽 메뉴에서 **SQL Editor** 클릭
3. `SETUP_DATABASE.sql` 파일 열기
4. 전체 내용 복사 (Ctrl+A → Ctrl+C)
5. SQL Editor에 붙여넣기 (Ctrl+V)
6. **Run** 버튼 클릭 ▶️

**완료!** 모든 테이블과 보안 정책이 자동으로 생성됩니다.

---

### 2단계: Storage 버킷 생성

1. Supabase 대시보드 → **Storage** 클릭
2. **Create a new bucket** 클릭
3. 다음 정보 입력:
   - **Bucket name**: `avatars`
   - **Public bucket**: ✅ **체크** (중요!)
4. **Create bucket** 클릭

**완료!** 프로필 사진을 저장할 공간이 생성되었습니다.

---

## 📋 생성되는 테이블

| 테이블명 | 설명 | 주요 컬럼 |
|---------|------|----------|
| **posts** | 게시물 | title, content, author_nickname, user_id |
| **comments** | 댓글 | content, author_nickname, post_id, user_id |
| **profiles** | 사용자 프로필 | nickname, bio, avatar_url, user_id |

---

## ⚠️ 문제 해결

### "테이블이 이미 존재합니다" 오류
→ **괜찮습니다!** 이미 있는 테이블은 건너뛰고 계속 진행됩니다.

### "컬럼을 찾을 수 없습니다" 오류
→ SQL을 다시 실행하세요. 누락된 컬럼이 자동으로 추가됩니다.

### 프로필 사진이 업로드되지 않습니다
→ Storage 버킷의 **Public bucket** 설정을 확인하세요.

---

## 🗑️ 삭제해도 되는 파일

다음 파일들은 이제 필요 없습니다:
- ~~setup-tables.sql~~
- ~~setup-profiles-table.sql~~
- ~~fix-bio-column.sql~~

**SETUP_DATABASE.sql** 하나로 모든 설정이 완료됩니다!

---

## ✅ 설정 확인

SQL 실행 후 다음 항목을 확인하세요:

1. **Table Editor**에서 3개 테이블 확인:
   - ✅ posts
   - ✅ comments
   - ✅ profiles

2. **Storage**에서 버킷 확인:
   - ✅ avatars (Public)

모두 보인다면 설정 완료! 🎉
