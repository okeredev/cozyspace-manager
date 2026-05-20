import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Copy, Mail, Plus, Send, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/landlord/tenants")({
  component: TenantsPage,
});

type Invitation = {
  id: string;
  email: string;
  token: string;
  room_id: string | null;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  accepted_by: string | null;
  created_at: string;
};

type TenantRow = {
  tenant_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  room_name: string | null;
  property_name: string | null;
  rent_amount: number;
  end_date: string;
  status: string;
};

function TenantsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ["invitations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("landlord_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invitation[];
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["landlord-rooms-flat", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, properties!inner(name, landlord_id)")
        .eq("properties.landlord_id", user!.id);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        name: string;
        properties: { name: string };
      }>;
    },
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ["landlord-tenants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(
          "tenant_id, rent_amount, end_date, status, rooms(name, properties(name)), profiles!leases_tenant_id_fkey(full_name, phone)",
        )
        .eq("landlord_id", user!.id)
        .order("end_date");
      if (error) {
        // Profile join may fail if FK not declared; fall back without it
        const { data: d2, error: e2 } = await supabase
          .from("leases")
          .select(
            "tenant_id, rent_amount, end_date, status, rooms(name, properties(name))",
          )
          .eq("landlord_id", user!.id)
          .order("end_date");
        if (e2) throw e2;
        return (d2 ?? []).map(
          (r: {
            tenant_id: string;
            rent_amount: number;
            end_date: string;
            status: string;
            rooms: { name: string; properties: { name: string } } | null;
          }) => ({
            tenant_id: r.tenant_id,
            full_name: null,
            email: null,
            phone: null,
            room_name: r.rooms?.name ?? null,
            property_name: r.rooms?.properties?.name ?? null,
            rent_amount: r.rent_amount,
            end_date: r.end_date,
            status: r.status,
          }),
        ) as TenantRow[];
      }
      return (data ?? []).map(
        (r: {
          tenant_id: string;
          rent_amount: number;
          end_date: string;
          status: string;
          rooms: { name: string; properties: { name: string } } | null;
          profiles: { full_name: string | null; phone: string | null } | null;
        }) => ({
          tenant_id: r.tenant_id,
          full_name: r.profiles?.full_name ?? null,
          email: null,
          phone: r.profiles?.phone ?? null,
          room_name: r.rooms?.name ?? null,
          property_name: r.rooms?.properties?.name ?? null,
          rent_amount: r.rent_amount,
          end_date: r.end_date,
          status: r.status,
        }),
      ) as TenantRow[];
    },
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation revoked");
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invitations"] });
    },
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            Invite people to join your property — they sign up with the link you
            share.
          </p>
        </div>
        <InviteDialog rooms={rooms} />
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            <Users className="mr-1.5 h-4 w-4" /> Active ({tenants.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="mr-1.5 h-4 w-4" /> Invitations ({invitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {tenants.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No active tenants yet. Invite one and create a lease.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {tenants.map((t) => (
                <Card key={t.tenant_id + t.end_date}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">
                          {t.full_name || "Unnamed tenant"}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {t.room_name} · {t.property_name}
                        </p>
                      </div>
                      <Badge variant="secondary">{t.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                      <span>Lease ends {t.end_date}</span>
                      <span className="font-medium text-foreground">
                        ${Number(t.rent_amount).toFixed(0)}/mo
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No invitations yet.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="divide-y p-0">
                {invitations.map((inv) => (
                  <InvitationRow
                    key={inv.id}
                    inv={inv}
                    onRevoke={() => revoke.mutate(inv.id)}
                    onDelete={() => del.mutate(inv.id)}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InvitationRow({
  inv,
  onRevoke,
  onDelete,
}: {
  inv: Invitation;
  onRevoke: () => void;
  onDelete: () => void;
}) {
  const link = useMemo(
    () =>
      typeof window === "undefined"
        ? `/invite/${inv.token}`
        : `${window.location.origin}/invite/${inv.token}`,
    [inv.token],
  );
  const expired = new Date(inv.expires_at) < new Date();
  const status = expired && inv.status === "pending" ? "expired" : inv.status;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{inv.email}</span>
          <Badge
            variant={status === "pending" ? "default" : "secondary"}
            className="capitalize"
          >
            {status}
          </Badge>
        </div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{link}</div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            navigator.clipboard.writeText(link);
            toast.success("Invite link copied");
          }}
        >
          <Copy className="mr-1 h-3.5 w-3.5" /> Copy link
        </Button>
        {inv.status === "pending" && !expired ? (
          <Button size="icon" variant="ghost" onClick={onRevoke} title="Revoke">
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="icon" variant="ghost" onClick={onDelete} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

function InviteDialog({
  rooms,
}: {
  rooms: Array<{ id: string; name: string; properties: { name: string } }>;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState<string>("none");

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const cleaned = email.trim().toLowerCase();
      if (!/.+@.+\..+/.test(cleaned)) throw new Error("Enter a valid email");
      const { data, error } = await supabase
        .from("invitations")
        .insert({
          landlord_id: user.id,
          email: cleaned,
          room_id: roomId === "none" ? null : roomId,
        })
        .select("token")
        .single();
      if (error) throw error;
      return data.token as string;
    },
    onSuccess: (token) => {
      const link = `${window.location.origin}/invite/${token}`;
      navigator.clipboard?.writeText(link).catch(() => undefined);
      toast.success("Invitation created — link copied to clipboard");
      qc.invalidateQueries({ queryKey: ["invitations"] });
      setEmail("");
      setRoomId("none");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-1 h-4 w-4" /> Invite tenant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a tenant</DialogTitle>
          <DialogDescription>
            We generate a private link tied to this email. Share it however you like
            — they sign up and the lease can be created next.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="iemail">Tenant email</Label>
            <Input
              id="iemail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Pre-assign to room (optional)</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific room</SelectItem>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.properties?.name} · {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <Send className="mr-1 h-4 w-4" />
            {create.isPending ? "Creating…" : "Create invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
