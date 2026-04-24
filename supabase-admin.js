import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://naxxslgxyelefzdxjhze.supabase.co";
const supabaseKey = "sb_secret_dBNtz9mCMKrwnoq2hg46Ww_Rw8J_fWZ"; // ← возьми из Supabase → Project Settings → API → service_role

export const supabase = createClient(supabaseUrl, supabaseKey);