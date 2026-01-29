import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndvjpqubhjrsgjbkuxrh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdmpwcXViaGpyc2dqYmt1eHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTY2MDEsImV4cCI6MjA4NTE5MjYwMX0.nM_UjOqimyu6SDkmpVGXJDP0OGpQB1k9wlwi8pOm1f4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);