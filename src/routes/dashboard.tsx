import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * /dashboard is a thin redirect router: send users to the right home based on role.
 * Used right after sign-in so the caller doesn't need to know which role they have.
 */
export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) throw redirect({ to: "/login" });

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", sess.session.user.id);

    const roleSet = new Set((roles ?? []).map((r) => r.role));
    if (roleSet.has("admin")) throw redirect({ to: "/admin" });
    if (roleSet.has("landlord")) throw redirect({ to: "/landlord" });
    if (roleSet.has("tenant")) throw redirect({ to: "/tenant" });
    throw redirect({ to: "/" });
  },
  component: () => null,
});
