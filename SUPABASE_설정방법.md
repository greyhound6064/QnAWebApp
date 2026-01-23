# 🔑 Supabase API 키 설정 방법

## ❌ 현재 문제
`fail to fetch` 오류는 **잘못된 API 키** 때문에 발생합니다.

---

## ✅ 해결 방법

### 1단계: 올바른 API 키 찾기

1. **Supabase 대시보드** 접속
2. 왼쪽 하단 **⚙️ Project Settings** 클릭
3. **API** 탭 선택
4. 다음 두 값을 복사하세요:

```
📋 복사할 값:

1. Project URL
   예: https://aymgfbvosidrziopfbir.supabase.co

2. Project API keys → anon public
   예: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... (매우 긴 문자열)
```

⚠️ **주의**: 
- `anon` 또는 `public` 키를 사용하세요 (가장 긴 키)
- `service_role` 키는 **절대 사용하지 마세요** (보안 위험)

---

### 2단계: supabase-config.js 파일 수정

`supabase-config.js` 파일을 열고 다음과 같이 수정:

```javascript
const SUPABASE_URL = 'https://aymgfbvosidrziopfbir.supabase.co'; // 1번 값
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 2번 값 (매우 긴 문자열)
```

---

### 3단계: 확인

1. 파일 저장 (Ctrl + S)
2. 브라우저 새로고침 (Ctrl + F5)
3. 브라우저 콘솔 확인:
   - ✅ "Supabase 연결 성공" 메시지가 보이면 성공!
   - ❌ 오류가 보이면 API 키를 다시 확인

---

## 🔍 API 키 형식 확인

### ✅ 올바른 키 (anon/public)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bWdmYnZvc2lkcnppb3BmYmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYxNjcwMDAsImV4cCI6MjAyMTc0MzAwMH0.abcdefghijklmnopqrstuvwxyz123456789
```
- **특징**: `eyJ`로 시작, 매우 긴 문자열 (200자 이상)

### ❌ 잘못된 키
```
sb_publishable_26qzHg69ce4sawpy6GAfPA_nzOwXqzB
```
- **특징**: `sb_`로 시작 (이것은 유효하지 않은 키)

---

## 🚨 문제 해결

### "API 재시작 후에도 fail to fetch"
→ API 키가 잘못되었습니다. 위 1-3단계를 다시 확인하세요.

### "API를 찾을 수 없습니다"
→ Project Settings → API에서 **Restart API server** 버튼을 다시 클릭하고 1-2분 대기

### "CORS 오류"
→ Supabase 대시보드에서 Authentication → URL Configuration 확인

---

## 📝 체크리스트

- [ ] Supabase 대시보드에서 **anon public 키** 복사
- [ ] `supabase-config.js` 파일에 키 붙여넣기
- [ ] 파일 저장
- [ ] 브라우저 새로고침 (Ctrl + F5)
- [ ] 콘솔에서 "Supabase 연결 성공" 확인
