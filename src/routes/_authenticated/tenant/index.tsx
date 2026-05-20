import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Receipt, Wrench, Megaphone, Building2, DoorOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenant/")({
  component: TenantDashboard,
});

function TenantDashboard() {
  const { user } = useAuth();

  const { data: lease } = useQuery({
    queryKey: ["tenant-lease", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("leases")
        .select("*, rooms(name, photos, properties(name, address))")
        .eq("tenant_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  // Properties from landlords who invited this tenant (RLS scopes results)
  const { data: landlordProperties } = useQuery({
    queryKey: ["tenant-landlord-properties", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select(
          "id, name, address, city, cover_image_url, landlord_id, rooms(id, name, price, status, photos, is_listed)"
        )
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          Welcome{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need, in one place.</p>
      </div>

      {lease ? (
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[1fr_auto]">
            <CardContent className="p-6">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Your residence</div>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                {lease.rooms?.properties?.name} — {lease.rooms?.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{lease.rooms?.properties?.address}</p>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-muted-foreground">Rent</div>
                  <div className="mt-1 font-display text-lg">₦{Number(lease.rent_amount).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cycle</div>
                  <div className="mt-1 font-display text-lg capitalize">{lease.billing_cycle}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Lease ends</div>
                  <div className="mt-1 font-display text-lg">{new Date(lease.end_date).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="mt-1 font-display text-lg capitalize">{lease.status}</div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Home className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-xl">No active lease yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse available rooms or wait for your landlord to set things up.
            </p>
            <Button asChild className="mt-5">
              <Link to="/browse">Browse rooms</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { to: "/tenant/payments", icon: Receipt, label: "Payments", desc: "View receipts & balance" },
          { to: "/tenant/tickets", icon: Wrench, label: "Maintenance", desc: "Report an issue" },
          { to: "/tenant/announcements", icon: Megaphone, label: "Announcements", desc: "Latest updates" },
        ].map((s) => (
          <Link key={s.to} to={s.to} className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </span>
            <div className="mt-4 font-display text-lg">{s.label}</div>
            <div className="text-sm text-muted-foreground">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
