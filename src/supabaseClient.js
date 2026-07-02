import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pnxokgsyzrkblgfcbndc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VR2Xt0QvmwwLf2L8bRricQ_BGW1tCXq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
