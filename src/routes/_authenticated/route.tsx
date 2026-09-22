import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { hasDemoAdminSession } from "@/lib/demo-admin";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
    if (isAdminRoute && hasDemoAdminSession()) return { user: null, demoAdmin: true };
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
    if (isAdminRoute) throw redirect({ to: "/dashboard" });
    return { user: data.user, demoAdmin: false };
  },
  component: () => <Outlet />,
});
