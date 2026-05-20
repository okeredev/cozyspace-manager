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
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/landlord/leases")({
  component: LeasesPage,
});

type Lease = {
  id: string;
  room_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  billing_cycle: string;
  status: "pending" | "active" | "expiring" | "expired" | "terminated";
  notes: string | null;
  rooms: { name: string; properties: { name: string } } | null;
};

type AcceptedInvite = {
  id: string;
  email: string;
  accepted_by: string;
};

function lifecycle(end_date: string, status: Lease["status"]) {
  if (status === "terminated" || status === "expired") return status;
  const now = new Date();
  const end = new Date(end_date);
  const days = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return status;
}

function LeasesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: leases = [], isLoading } = useQuery({
    queryKey: ["leases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(
          "id, room_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, billing_cycle, status, notes, rooms(name, properties(name))",
        )
        .eq("landlord_id", user!.id)
        .order("end_date");
      if (error) throw error;
      return data as unknown as Lease[];
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["landlord-rooms-with-price", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          "id, name, price, deposit, properties!inner(name, landlord_id)",
        )
        .eq("properties.landlord_id", user!.id);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        price: number;
        deposit: number;
        properties: { name: string };
      }>;
    },
  });

  const { data: acceptedInvites = [] } = useQuery({
    queryKey: ["accepted-invitations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("id, email, accepted_by")
        .eq("landlord_id", user!.id)
        .eq("status", "accepted")
        .not("accepted_by", "is", null);
      if (error) throw error;
      return (data ?? []) as AcceptedInvite[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lease deleted");
      qc.invalidateQueries({ queryKey: ["leases"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Leases</h1>
          <p className="text-sm text-muted-foreground">
            Active and historical agreements. Lifecycle flags fire 30 days before
            expiry.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New lease
            </Button>
          </DialogTrigger>
          <LeaseDialog
            rooms={rooms}
            tenants={acceptedInvites}
            onDone={() => setOpen(false)}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : leases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10" />
            <p className="mt-3 text-sm">No leases yet — invite a tenant and create one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {leases.map((l) => {
            const status = lifecycle(l.end_date, l.status);
            const color =
              status === "active"
                ? "bg-primary/15 text-primary-deep"
                : status === "expiring"
                  ? "bg-gold/20 text-gold-foreground"
                  : status === "expired" || status === "terminated"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-muted text-muted-foreground";
            return (
              <Card key={l.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">
                        {l.rooms?.name} · {l.rooms?.properties?.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {l.start_date} → {l.end_date} · {l.billing_cycle}
                      </p>
                    </div>
                    <Badge className={color} variant="secondary">
                      {status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Rent</span>
                      <div className="font-semibold">
                        ₦{Number(l.rent_amount).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Deposit</span>
                      <div className="font-semibold">
                        ₦{Number(l.deposit_amount).toFixed(0)}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this lease?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Payments linked to this lease will also be removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(l.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LeaseDialog({
  rooms,
  tenants,
  onDone,
}: {
  rooms: Array<{
    id: string;
    name: string;
    price: number;
    deposit: number;
    properties: { name: string };
  }>;
  tenants: AcceptedInvite[];
  onDone: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [roomId, setRoomId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10),
  );
  const [cycle, setCycle] = useState("monthly");
  const [rent, setRent] = useState("0");
  const [deposit, setDeposit] = useState("0");
  const [notes, setNotes] = useState("");

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === roomId),
    [rooms, roomId],
  );

  function onRoomChange(id: string) {
    setRoomId(id);
    const r = rooms.find((x) => x.id === id);
    if (r) {
      setRent(String(r.price));
      setDeposit(String(r.deposit));
    }
  }

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!roomId) throw new Error("Pick a room");
      if (!tenantId) throw new Error("Pick a tenant");
      if (new Date(endDate) <= new Date(startDate))
        throw new Error("End date must be after start date");
      const { error } = await supabase.from("leases").insert({
        landlord_id: user.id,
        room_id: roomId,
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        billing_cycle: cycle,
        rent_amount: Number(rent) || 0,
        deposit_amount: Number(deposit) || 0,
        notes: notes.trim() || null,
        status: "active",
      });
      if (error) throw error;
      // mark room occupied
      await supabase
        .from("rooms")
        .update({ status: "occupied" })
        .eq("id", roomId);
    },
    onSuccess: () => {
      toast.success("Lease created");
      qc.invalidateQueries({ queryKey: ["leases"] });
      qc.invalidateQueries({ queryKey: ["rooms"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>New lease</DialogTitle>
        <DialogDescription>
          Bind an accepted tenant to one of your rooms. Marks the room occupied.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label>Room</Label>
          <Select value={roomId} onValueChange={onRoomChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a room" />
            </SelectTrigger>
            <SelectContent>
              {rooms.length === 0 ? (
                <SelectItem value="none" disabled>
                  No rooms — add one first
                </SelectItem>
              ) : null}
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.properties?.name} · {r.name} (₦{Number(r.price).toFixed(0)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Tenant (accepted invites)</Label>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              {tenants.length === 0 ? (
                <SelectItem value="none" disabled>
                  No accepted invitations yet
                </SelectItem>
              ) : null}
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.accepted_by}>
                  {t.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Start date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>End date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label>Rent</Label>
            <Input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Deposit</Label>
            <Input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Cycle</Label>
            <Select value={cycle} onValueChange={setCycle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {selectedRoom ? (
          <p className="text-xs text-muted-foreground">
            Defaults pulled from {selectedRoom.name}.
          </p>
        ) : null}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create lease"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
