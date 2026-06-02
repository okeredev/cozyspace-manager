import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getUser() re-validates the JWT with the Auth server so we never let a
    // stale/expired token through. Falls back to /login with a redirect-back.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href } as never,
      });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
