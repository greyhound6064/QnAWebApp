-- profiles 테이블에 bio 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 확인: profiles 테이블의 모든 컬럼 조회
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
