import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Receipt, Plus, Trash2, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/landlord/payments")({
  component: PaymentsPage,
});

type Lease = {
  id: string;
  tenant_id: string;
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
  created_at: string;
};

function PaymentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: leases = [] } = useQuery({
    queryKey: ["landlord-active-leases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select("id, tenant_id, rent_amount, billing_cycle, rooms(name, properties(name))")
        .eq("landlord_id", user!.id);
      if (error) throw error;
      return data as unknown as Lease[];
    },
  });

  const leaseIds = useMemo(() => leases.map((l) => l.id), [leases]);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["landlord-payments", leaseIds.join(",")],
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

  const totals = useMemo(() => {
    const paid = payments
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + Number(p.amount), 0);
    const pending = payments
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + Number(p.amount), 0);
    const thisMonth = payments
      .filter((p) => {
        const d = new Date(p.paid_on);
        const n = new Date();
        return (
          p.status === "paid" &&
          d.getMonth() === n.getMonth() &&
          d.getFullYear() === n.getFullYear()
        );
      })
      .reduce((s, p) => s + Number(p.amount), 0);
    return { paid, pending, thisMonth };
  }, [payments]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment removed");
      qc.invalidateQueries({ queryKey: ["landlord-payments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leaseLabel = (id: string) => {
    const l = leases.find((x) => x.id === id);
    if (!l) return "—";
    return `${l.rooms?.properties?.name ?? ""} · ${l.rooms?.name ?? ""}`;
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Record rent collected and track outstanding balances.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={leases.length === 0}>
              <Plus className="mr-1 h-4 w-4" /> Record payment
            </Button>
          </DialogTrigger>
          <PaymentDialog leases={leases} onDone={() => setOpen(false)} />
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Collected this month" value={`$${totals.thisMonth.toFixed(0)}`} icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="Total paid" value={`$${totals.paid.toFixed(0)}`} icon={<DollarSign className="h-4 w-4" />} />
        <Stat label="Pending" value={`$${totals.pending.toFixed(0)}`} icon={<Receipt className="h-4 w-4" />} />
      </div>

      {leases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Create a lease first, then record payments against it.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center text-muted-foreground">
            <Receipt className="h-10 w-10" />
            <p className="mt-3 text-sm">No payments recorded yet.</p>
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
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold">{leaseLabel(p.lease_id)}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.paid_on} · {p.method}
                        {p.reference ? ` · ${p.reference}` : ""}
                      </div>
                      {p.notes ? (
                        <div className="mt-1 text-xs text-muted-foreground">{p.notes}</div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={color} variant="secondary">
                        {p.status}
                      </Badge>
                      <div className="text-right font-semibold">
                        ${Number(p.amount).toFixed(0)}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes the receipt permanently.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del.mutate(p.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          {icon}
        </div>
        <div className="mt-1 font-display text-2xl">{value}</div>
      </CardContent>
    </Card>
  );
}

function PaymentDialog({
  leases,
  onDone,
}: {
  leases: Lease[];
  onDone: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [leaseId, setLeaseId] = useState("");
  const [amount, setAmount] = useState("0");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"paid" | "pending" | "failed" | "refunded">("paid");

  function onLeaseChange(id: string) {
    setLeaseId(id);
    const l = leases.find((x) => x.id === id);
    if (l) setAmount(String(l.rent_amount));
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!leaseId) throw new Error("Pick a lease");
      const amt = Number(amount);
      if (!amt || amt <= 0) throw new Error("Enter a positive amount");
      const { error } = await supabase.from("payments").insert({
        lease_id: leaseId,
        amount: amt,
        paid_on: paidOn,
        method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        status,
        recorded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      qc.invalidateQueries({ queryKey: ["landlord-payments"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          Log a rent payment against an active lease.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label>Lease</Label>
          <Select value={leaseId} onValueChange={onLeaseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a lease" />
            </SelectTrigger>
            <SelectContent>
              {leases.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.rooms?.properties?.name} · {l.rooms?.name} (${Number(l.rent_amount).toFixed(0)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Amount</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Paid on</Label>
            <Input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile money</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Reference (optional)</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction ID, check no."
          />
        </div>

        <div className="grid gap-2">
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
