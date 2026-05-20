import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { DoorOpen, Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ property: z.string().optional() });

export const Route = createFileRoute("/_authenticated/landlord/rooms")({
  validateSearch: searchSchema,
  component: RoomsPage,
});

type Property = { id: string; name: string };
type RoomLabel = { id: string; name: string; color: string };
type RoomStatus = "vacant" | "reserved" | "occupied" | "maintenance";
type Room = {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  price: number;
  deposit: number;
  first_payment: number;
  renewal_payment: number;
  lease_duration_months: number;
  capacity: number;
  status: RoomStatus;
  label_id: string | null;
  is_listed: boolean;
};

const STATUS_COLORS: Record<RoomStatus, string> = {
  vacant: "bg-muted text-muted-foreground",
  reserved: "bg-gold/20 text-gold-foreground",
  occupied: "bg-primary/15 text-primary-deep",
  maintenance: "bg-destructive/15 text-destructive",
};

function RoomsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const propertyFilter = search.property ?? "all";
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);

  const { data: properties = [] } = useQuery({
    queryKey: ["properties", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, name")
        .eq("landlord_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as Property[];
    },
  });

  const { data: labels = [] } = useQuery({
    queryKey: ["labels", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_labels")
        .select("id, name, color")
        .eq("landlord_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as RoomLabel[];
    },
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms", user?.id, propertyFilter],
    enabled: !!user && properties.length > 0,
    queryFn: async () => {
      const ids =
        propertyFilter === "all" ? properties.map((p) => p.id) : [propertyFilter];
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .in("property_id", ids)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Room[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Room deleted");
      qc.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const propertyName = (id: string) =>
    properties.find((p) => p.id === id)?.name ?? "—";
  const labelFor = (id: string | null) =>
    id ? labels.find((l) => l.id === id) ?? null : null;

  if (properties.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center p-16 text-center">
            <DoorOpen className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-xl">Create a property first</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Rooms live inside properties. Add a building before adding rooms.
            </p>
            <Button asChild className="mt-5">
              <Link to="/landlord/properties">Go to properties</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Rooms</h1>
          <p className="text-sm text-muted-foreground">
            Individual rentable units. Set price, capacity, labels, and status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={propertyFilter}
            onValueChange={(v) =>
              navigate({ search: { property: v === "all" ? undefined : v } })
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All properties</SelectItem>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="mr-1 h-4 w-4" /> Add room
              </Button>
            </DialogTrigger>
            <RoomDialog
              existing={editing}
              defaultPropertyId={
                propertyFilter === "all" ? properties[0]?.id : propertyFilter
              }
              properties={properties}
              labels={labels}
              onDone={() => {
                setOpen(false);
                setEditing(null);
              }}
            />
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center text-muted-foreground">
            No rooms in this view. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => {
            const lbl = labelFor(r.label_id);
            return (
              <Card key={r.id} className="transition-all hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{r.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {propertyName(r.property_id)}
                      </p>
                    </div>
                    <Badge className={STATUS_COLORS[r.status]} variant="secondary">
                      {r.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Rent / mo</div>
                      <div className="font-semibold">${Number(r.price).toFixed(0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">First year</div>
                      <div className="font-semibold">
                        ${Number(r.first_payment).toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Renewal (yr 2+)</div>
                      <div className="font-semibold">
                        ${Number(r.renewal_payment).toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> capacity {r.capacity}
                    </span>
                    <span>{r.is_listed ? "Listed publicly" : "Not listed"}</span>
                  </div>

                  {lbl ? (
                    <div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          background: `${lbl.color}22`,
                          color: lbl.color,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: lbl.color }}
                        />
                        {lbl.name}
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-end gap-1 border-t pt-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(r);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {r.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This cannot be undone. Active leases will block deletion.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(r.id)}>
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

function RoomDialog({
  existing,
  defaultPropertyId,
  properties,
  labels,
  onDone,
}: {
  existing: Room | null;
  defaultPropertyId?: string;
  properties: Property[];
  labels: RoomLabel[];
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(existing?.name ?? "");
  const [propertyId, setPropertyId] = useState(
    existing?.property_id ?? defaultPropertyId ?? "",
  );
  const [description, setDescription] = useState(existing?.description ?? "");
  const [price, setPrice] = useState(existing?.price?.toString() ?? "0");
  const [deposit, setDeposit] = useState(existing?.deposit?.toString() ?? "0");
  const [firstPayment, setFirstPayment] = useState(
    existing?.first_payment?.toString() ?? "0",
  );
  const [leaseMonths, setLeaseMonths] = useState(
    existing?.lease_duration_months?.toString() ?? "12",
  );
  const [capacity, setCapacity] = useState(existing?.capacity?.toString() ?? "1");
  const [status, setStatus] = useState<RoomStatus>(existing?.status ?? "vacant");
  const [labelId, setLabelId] = useState<string>(existing?.label_id ?? "none");
  const [isListed, setIsListed] = useState(existing?.is_listed ?? true);

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required");
      if (!propertyId) throw new Error("Select a property");
      const payload = {
        property_id: propertyId,
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price) || 0,
        deposit: Number(deposit) || 0,
        first_payment: Number(firstPayment) || 0,
        lease_duration_months: Math.max(1, Number(leaseMonths) || 12),
        capacity: Math.max(1, Number(capacity) || 1),
        status,
        label_id: labelId === "none" ? null : labelId,
        is_listed: isListed,
      };
      if (existing) {
        const { error } = await supabase
          .from("rooms")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("rooms").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(existing ? "Room updated" : "Room created");
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["property-room-counts"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{existing ? "Edit room" : "New room"}</DialogTitle>
        <DialogDescription>
          Set details, rent, and status. Listed rooms appear in the public marketplace.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Name / number</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="A-101"
            />
          </div>
          <div className="grid gap-2">
            <Label>Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label>Monthly rent</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Refundable deposit</Label>
            <Input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Returned at lease end.</p>
          </div>
          <div className="grid gap-2">
            <Label>First payment</Label>
            <Input
              type="number"
              value={firstPayment}
              onChange={(e) => setFirstPayment(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">Due at move-in.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Lease duration (months)</Label>
            <Input
              type="number"
              min={1}
              value={leaseMonths}
              onChange={(e) => setLeaseMonths(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as RoomStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Label</Label>
            <Select value={labelId} onValueChange={setLabelId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No label</SelectItem>
                {labels.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Description</Label>
          <Textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Sunny corner room, balcony, ensuite bath…"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isListed}
            onChange={(e) => setIsListed(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          List on public marketplace
        </label>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : existing ? "Save changes" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
