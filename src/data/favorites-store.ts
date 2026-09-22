import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeAccountEmail, type AccountIdentity } from "./account-profile";

// Backend-backed favorites. Rows live in the `favorites` table and are scoped
// to the signed-in student by row level security.

let favorites: string[] = [];
let snapshot: string[] = favorites;
let accountEmail = "";
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const serverSnapshot: string[] = [];

function emit() {
  snapshot = favorites;
  listeners.forEach((listener) => listener());
}

async function load() {
  const { data: sessionData } = await supabase.auth.getSession();
  const email = normalizeAccountEmail(sessionData.session?.user.email);
  accountEmail = email;
  if (!email) {
    favorites = [];
    emit();
    return;
  }
  const { data, error } = await supabase.from("favorites").select("resource_id");
  if (error) {
    console.error("Failed to load favorites", error.message);
    return;
  }
  favorites = (data as { resource_id: string }[]).map((row) => row.resource_id);
  emit();
}

function ensureLoaded() {
  if (typeof window === "undefined" || loading) return;
  loading = load();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFavoriteIds(_owner: AccountIdentity | null | undefined): string[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}

export function useIsFavorite(id: string, owner: AccountIdentity | null | undefined): boolean {
  return useFavoriteIds(owner).includes(id);
}

export function toggleFavorite(id: string, owner: AccountIdentity | null | undefined): boolean {
  const email = normalizeAccountEmail(owner?.email) || accountEmail;
  if (!email) return false;
  const removing = favorites.includes(id);
  favorites = removing ? favorites.filter((value) => value !== id) : [id, ...favorites];
  emit();
  void (async () => {
    if (removing) {
      const { error } = await supabase.from("favorites").delete().eq("resource_id", id).eq("user_email", email);
      if (error) console.error("Failed to remove favorite", error.message);
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ resource_id: id, user_email: email, user_id: owner?.id ?? null });
      if (error) console.error("Failed to save favorite", error.message);
    }
  })();
  return !removing;
}

export function removeFavorite(id: string, owner: AccountIdentity | null | undefined) {
  if (!favorites.includes(id)) return;
  toggleFavorite(id, owner);
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
      loading = load();
    }
  });
}
