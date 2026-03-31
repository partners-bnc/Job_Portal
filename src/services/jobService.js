// Re-export from the new Supabase service for backward compatibility
// All pages importing from 'jobService.js' will automatically use Supabase
export { jobService } from './supabaseService.js';