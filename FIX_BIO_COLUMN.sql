-- ==========================================
-- 🔧 bio 컬럼 추가 및 스키마 캐시 갱신
-- ==========================================

-- 1. bio 컬럼 추가 (이미 있어도 오류 안남)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. 컬럼 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 3. 스키마 캐시 강제 갱신
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- 실행 후 결과:
-- bio 컬럼이 표시되어야 합니다
-- ==========================================
