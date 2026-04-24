import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://naxxslgxyelefzdxjhze.supabase.co";
const supabaseKey = "sb_publishable_cU_zUkI5f_qltx0KQIe6xw_k4JLk-IF";

export const supabase = createClient(supabaseUrl, supabaseKey);
