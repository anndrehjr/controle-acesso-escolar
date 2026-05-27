import { createClient } from "../lib/supabase/client";

export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const { data: usuario, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("auth_id", session.user.id)
    .single();

  if (error || !usuario) {
    return null;
  }

  return usuario;
}