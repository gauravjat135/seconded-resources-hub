import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ListingOwner } from "@/data/marketplace";

function toOwner(user: { id: string; email?: string | null } | null | undefined): ListingOwner | null {
  return user ? { id: user.id, email: user.email ?? null } : null;
}

/**
 * Session-backed current user. Uses getSession() (local storage read) so the
 * signed-in state resolves immediately, and stays in sync with auth events.
 */
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<ListingOwner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setCurrentUser(toOwner(data.session?.user));
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(toOwner(session?.user));
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { currentUser, loading };
}

/** Reads the current session user once, without a network round-trip. */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
