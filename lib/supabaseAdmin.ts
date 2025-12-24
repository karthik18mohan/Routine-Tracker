import { createClient } from "@supabase/supabase-js";

// We intentionally type the client as `any` because we haven't generated Supabase Database types.
// Otherwise Supabase can infer rows as `never`, causing build-time TS errors.
let cachedClient: ReturnType<typeof createClient<any>> | null = null;

export const getSupabaseAdmin = () => {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  cachedClient = createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return cachedClient;
};
