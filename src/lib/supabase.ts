import { createClient } from "@supabase/supabase-js";

// Credenciais públicas (anon key) do projeto Supabase do usuário.
const SUPABASE_URL = "https://gkmfhbsdimfkpumiktbf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbWZoYnNkaW1ma3B1bWlrdGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1ODcwMTQsImV4cCI6MjEwMzE2MzAxNH0.TmyZ2DuEt79g80y9M6F4t88anGvOxP083sR4qcVMrAE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
