import { createClient } from "../lib/supabase/client";

const supabase = createClient();

export async function login(email: string, senha: string) {
  return await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
}

export async function logout() {
  return await supabase.auth.signOut();
}