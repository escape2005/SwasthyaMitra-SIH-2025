import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://gmzifovdlyxgkcopvluo.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdtemlmb3ZkbHl4Z2tjb3B2bHVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NTAzNDUsImV4cCI6MjA3MjMyNjM0NX0.jr1V2ra1f2N3I0-MwyaStmut-F43uI4Bfh__RVAzdGc";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};
