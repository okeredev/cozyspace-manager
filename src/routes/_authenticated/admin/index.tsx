import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Building2,
  DoorOpen,
  FileText,
  Receipt,
  Wrench,
  Inbox,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function useCount(table: string) {
  return useQuery({
    queryKey: ["admin-count", table],
    queryFn: async () => {
      const { count } = await supabase
        .from(table as any)
        .select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="font-display text-2xl">{value}</div>
          </div>
        </div>
        {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function AdminOverview() {
  const users = useCount("profiles");
  const properties = useCount("properties");
  const rooms = useCount("rooms");
  const leases = useCount("leases");
  const tickets = useCount("maintenance_tickets");
  const bookings = useCount("booking_requests");

  const { data: revenue } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("amount,paid_on,status");
      const paid = (data ?? []).filter((p) => p.status === "paid");
      const total = paid.reduce((s, p) => s + Number(p.amount), 0);
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const last30 = paid
        .filter((p) => new Date(p.paid_on) >= since)
        .reduce((s, p) => s + Number(p.amount), 0);
      return { total, last30, count: paid.length };
    },
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["admin-recent-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id,amount,paid_on,method,status,lease_id,leases(rent_amount,rooms(name,properties(name)))")
        .order("paid_on", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: recentTickets } = useQuery({
    queryKey: ["admin-recent-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_tickets")
        .select("id,title,status,priority,created_at,rooms(name,properties(name))")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold">Admin overview</h1>
          <p className="text-sm text-muted-foreground">
            Platform health at a glance.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Users" value={users.data ?? "—"} />
        <Stat icon={Building2} label="Properties" value={properties.data ?? "—"} />
        <Stat icon={DoorOpen} label="Rooms" value={rooms.data ?? "—"} />
        <Stat icon={FileText} label="Active leases" value={leases.data ?? "—"} />
        <Stat
          icon={Receipt}
          label="Lifetime revenue"
          value={`₦${(revenue?.total ?? 0).toLocaleString()}`}
          hint={`${revenue?.count ?? 0} paid receipts`}
        />
        <Stat
          icon={Receipt}
          label="Last 30 days"
          value={`₦${(revenue?.last30 ?? 0).toLocaleString()}`}
        />
        <Stat icon={Wrench} label="Tickets" value={tickets.data ?? "—"} />
        <Stat icon={Inbox} label="Booking requests" value={bookings.data ?? "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">Recent payments</h2>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </div>
            <ul className="divide-y">
              {(recentPayments ?? []).map((p: any) => (
                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <div className="font-medium">
                      {p.leases?.rooms?.properties?.name ?? "—"} · {p.leases?.rooms?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.paid_on).toLocaleDateString()} · {p.method}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display">₦{Number(p.amount).toLocaleString()}</div>
                    <div className="text-xs capitalize text-muted-foreground">{p.status}</div>
                  </div>
                </li>
              ))}
              {!recentPayments?.length && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  No payments recorded yet.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">Recent maintenance</h2>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </div>
            <ul className="divide-y">
              {(recentTickets ?? []).map((t: any) => (
                <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.rooms?.properties?.name ?? "—"} · {t.rooms?.name ?? "—"} ·{" "}
                      {new Date(t.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                      {t.priority}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                      {t.status}
                    </span>
                  </div>
                </li>
              ))}
              {!recentTickets?.length && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  No tickets reported.
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
