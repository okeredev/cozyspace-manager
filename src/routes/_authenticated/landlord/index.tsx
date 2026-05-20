import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DoorOpen, Users, Receipt, CalendarClock, Inbox } from "lucide-react";

export const Route = createFileRoute("/_authenticated/landlord/")({
  component: LandlordDashboard,
});

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Building2; label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function LandlordDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["landlord-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const uid = user!.id;
      const [props, rooms, leases, pending, payments] = await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("landlord_id", uid),
        supabase
          .from("rooms")
          .select("id,status,property_id,properties!inner(landlord_id)", { count: "exact" })
          .eq("properties.landlord_id", uid),
        supabase.from("leases").select("id,end_date,status", { count: "exact" }).eq("landlord_id", uid),
        supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("landlord_id", uid).eq("status", "pending"),
        supabase.from("payments").select("amount,paid_on,leases!inner(landlord_id)").eq("leases.landlord_id", uid).gte("paid_on", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      ]);

      const totalRooms = rooms.data?.length ?? 0;
      const occupied = rooms.data?.filter((r) => r.status === "occupied").length ?? 0;
      const occupancy = totalRooms ? Math.round((occupied / totalRooms) * 100) : 0;

      const now = new Date();
      const in30 = new Date(now);
      in30.setDate(in30.getDate() + 30);
      const expiring = (leases.data ?? []).filter(
        (l) => l.status === "active" && new Date(l.end_date) <= in30,
      ).length;

      const monthRevenue = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);

      return {
        properties: props.count ?? 0,
        rooms: totalRooms,
        occupancy,
        leases: leases.count ?? 0,
        pending: pending.count ?? 0,
        expiring,
        monthRevenue,
      };
    },
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your portfolio at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Building2} label="Properties" value={stats?.properties ?? "—"} />
        <Stat icon={DoorOpen} label="Rooms" value={stats?.rooms ?? "—"} hint={stats ? `${stats.occupancy}% occupied` : undefined} />
        <Stat icon={Users} label="Active leases" value={stats?.leases ?? "—"} />
        <Stat icon={Inbox} label="Pending requests" value={stats?.pending ?? "—"} />
        <Stat icon={CalendarClock} label="Expiring in 30 days" value={stats?.expiring ?? "—"} />
        <Stat
          icon={Receipt}
          label="Revenue this month"
          value={stats ? `₦${stats.monthRevenue.toLocaleString()}` : "—"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Getting started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Add your first <span className="font-medium text-foreground">property</span> from the Properties page.</p>
          <p>2. Create <span className="font-medium text-foreground">rooms</span> inside that property and label them.</p>
          <p>3. Invite tenants by email and assign them to a room with a <span className="font-medium text-foreground">lease</span>.</p>
          <p>4. Record rent <span className="font-medium text-foreground">payments</span> as they come in.</p>
        </CardContent>
      </Card>
    </div>
  );
}
