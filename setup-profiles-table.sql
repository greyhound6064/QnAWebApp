-- profiles 테이블이 이미 존재하는 경우 bio 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- profiles 테이블 생성 (존재하지 않는 경우)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- user_id에 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 프로필을 조회할 수 있도록 (공개)
CREATE POLICY "프로필 조회 허용" ON profiles
    FOR SELECT
    USING (true);

-- 본인의 프로필만 생성/수정 가능
CREATE POLICY "본인 프로필 생성 허용" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 프로필 수정 허용" ON profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 본인의 프로필만 삭제 가능
CREATE POLICY "본인 프로필 삭제 허용" ON profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- Storage 버킷 정책 (avatars 버킷이 이미 생성되어 있다고 가정)
-- Supabase Dashboard > Storage > avatars 버킷에서 다음 정책 추가:
-- 
-- 1. Public access for avatars (읽기 허용)
--    Policy name: Public avatar access
--    Target roles: public
--    Policy definition: SELECT
--    WITH CHECK: (bucket_id = 'avatars')
--
-- 2. Authenticated users can upload avatars (업로드 허용)
--    Policy name: Authenticated users can upload avatars
--    Target roles: authenticated
--    Policy definition: INSERT
--    WITH CHECK: (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
--
-- 3. Users can update their own avatars (수정 허용)
--    Policy name: Users can update own avatars
--    Target roles: authenticated
--    Policy definition: UPDATE
--    USING: (bucket_id = 'avatars')
--
-- 4. Users can delete their own avatars (삭제 허용)
--    Policy name: Users can delete own avatars
--    Target roles: authenticated
--    Policy definition: DELETE
--    USING: (bucket_id = 'avatars')
