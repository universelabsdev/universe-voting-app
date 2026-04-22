import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Basic validation to prevent immediate crashes if user inputs malformed URL in secrets
const formattedUrl = supabaseUrl && supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`;

export const supabase = createClient(formattedUrl, supabaseAnonKey);
