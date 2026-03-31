import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bvvqyjqokvnttbgyjkrt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dnF5anFva3ZudHRiZ3lqa3J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTEwNjgsImV4cCI6MjA5MDI2NzA2OH0._86TJOSSngKZdVz4NqT3ONzQCUA9RjjUySew6qYhJJw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export { SUPABASE_URL };
