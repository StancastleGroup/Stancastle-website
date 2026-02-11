import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://ndvjpqubhjrsgjbkuxrh.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdmpwcXViaGpyc2dqYmt1eHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTY2MDEsImV4cCI6MjA4NTE5MjYwMX0.nM_UjOqimyu6SDkmpVGXJDP0OGpQB1k9wlwi8pOm1f4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);