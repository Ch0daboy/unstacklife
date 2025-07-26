import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `Missing Supabase environment variables. Please check your .env file:
  - VITE_SUPABASE_URL: ${supabaseUrl ? 'exists' : 'MISSING'}
  - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'exists' : 'MISSING'}
  
  Make sure your .env file contains:
  VITE_SUPABASE_URL=your_supabase_project_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`;
  
  console.error(errorMessage);
  throw new Error(errorMessage);
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  const errorMessage = `Invalid Supabase URL format: ${supabaseUrl}. Please check your VITE_SUPABASE_URL in .env file.`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

console.log('Supabase client initializing with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'bookgen-app'
    }
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    console.log('Supabase connection test result:', { data: !!data, error });
    return { success: !error, error };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { success: false, error };
  }
};