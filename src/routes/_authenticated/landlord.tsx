import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LandlordSidebar } from "@/components/landlord-sidebar";

export const Route = createFileRoute("/_authenticated/landlord")({
  beforeLoad: async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) throw redirect({ to: "/login" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", sess.session.user.id)
      .eq("role", "landlord");
    if (!roles?.length) throw redirect({ to: "/tenant" });
  },
  component: LandlordShell,
});

function LandlordShell() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <LandlordSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="text-sm text-muted-foreground">Landlord console</span>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
