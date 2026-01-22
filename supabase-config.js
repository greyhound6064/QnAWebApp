const SUPABASE_URL = 'https://aymgfbvosidrziopfbir.supabase.co';
const SUPABASE_KEY = 'sb_publishable_26qzHg69ce4sawpy6GAfPA_nzOwXqzB';

let _supabase;
try {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        }
    });
} catch (e) {
    console.error('Supabase 초기화 실패:', e);
    _supabase = null;
}