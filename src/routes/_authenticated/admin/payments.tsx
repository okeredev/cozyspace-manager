import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPayments,
});

function AdminPayments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id,amount,paid_on,method,status,reference,leases(rent_amount,rooms(name,properties(name)))")
        .order("paid_on", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  const total = (payments ?? [])
    .filter((p: any) => p.status === "paid")
    .reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Receipt className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold">All payments</h1>
          <p className="text-sm text-muted-foreground">
            ₦{total.toLocaleString()} across {payments?.length ?? 0} records.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div>Lease</div>
            <div>Method</div>
            <div>Status</div>
            <div className="text-right">Amount</div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : payments?.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No payments yet.
            </div>
          ) : (
            <ul className="divide-y">
              {(payments ?? []).map((p: any) => (
                <li
                  key={p.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 px-5 py-3 text-sm"
                >
                  <div>
                    <div className="font-medium">
                      {p.leases?.rooms?.properties?.name ?? "—"} ·{" "}
                      {p.leases?.rooms?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(p.paid_on).toLocaleDateString()}
                      {p.reference ? ` · ref ${p.reference}` : ""}
                    </div>
                  </div>
                  <div className="capitalize">{p.method}</div>
                  <div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs capitalize text-primary">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-right font-display">
                    ₦{Number(p.amount).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
