import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://naxxslgxyelefzdxjhze.supabase.co";
const supabaseKey = ""; // ← возьми из Supabase → Project Settings → API → service_role

export const supabase = createClient(supabaseUrl, supabaseKey);