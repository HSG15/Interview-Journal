// js/supabaseClient.js

window.SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
window.SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize the Supabase client
const supabaseInstance = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

window.SupabaseClient = supabaseInstance;
