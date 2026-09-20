import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://wqtoxtyrersrmosdyhlp.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseAnonKey && import.meta.env.DEV) {
  console.warn(
    "[supabase] VITE_SUPABASE_ANON_KEY 가 비어 있습니다. .env 를 확인하세요.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
