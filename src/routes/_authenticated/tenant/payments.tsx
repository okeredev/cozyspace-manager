import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, DollarSign, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenant/payments")({
  component: TenantPaymentsPage,
});

type Lease = {
  id: string;
  rent_amount: number;
  billing_cycle: string;
  rooms: { name: string; properties: { name: string } } | null;
};

type Payment = {
  id: string;
  lease_id: string;
  amount: number;
  paid_on: string;
  method: string;
  reference: string | null;
  notes: string | null;
  status: "pending" | "paid" | "overdue" | "refunded";
};

function TenantPaymentsPage() {
  const { user } = useAuth();

  const { data: leases = [] } = useQuery({
    queryKey: ["tenant-leases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select("id, rent_amount, billing_cycle, rooms(name, properties(name))")
        .eq("tenant_id", user!.id);
      if (error) throw error;
      return data as unknown as Lease[];
    },
  });

  const leaseIds = useMemo(() => leases.map((l) => l.id), [leases]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["tenant-payments", leaseIds.join(",")],
    enabled: leaseIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .in("lease_id", leaseIds)
        .order("paid_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Payment[];
    },
  });

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((s, p) => s + Number(p.amount), 0);

  const leaseLabel = (id: string) => {
    const l = leases.find((x) => x.id === id);
    return l ? `${l.rooms?.properties?.name} · ${l.rooms?.name}` : "—";
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl">My payments</h1>
        <p className="text-sm text-muted-foreground">
          History and receipts for all your leases.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Total paid</span>
              <DollarSign className="h-4 w-4" />
            </div>
            <div className="mt-1 font-display text-2xl">₦{totalPaid.toFixed(0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Outstanding</span>
              <Clock className="h-4 w-4" />
            </div>
            <div className="mt-1 font-display text-2xl">₦{outstanding.toFixed(0)}</div>
          </CardContent>
        </Card>
      </div>

      {leases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            You don't have an active lease yet.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center text-muted-foreground">
            <Receipt className="h-10 w-10" />
            <p className="mt-3 text-sm">No payments on record yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {payments.map((p) => {
                const color =
                  p.status === "paid"
                    ? "bg-primary/15 text-primary-deep"
                    : p.status === "pending"
                      ? "bg-gold/20 text-gold-foreground"
                      : p.status === "overdue"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-muted text-muted-foreground";
                return (
                  <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <div className="font-semibold">{leaseLabel(p.lease_id)}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.paid_on} · {p.method}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={color} variant="secondary">{p.status}</Badge>
                      <div className="text-right font-semibold">
                        ₦{Number(p.amount).toFixed(0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
