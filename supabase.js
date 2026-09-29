import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://ggixzqzbskwxopyxpkuj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable__E2CyWlpZYmx75Ww9k0d_w_vXUUUttm';

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);