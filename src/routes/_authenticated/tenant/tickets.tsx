import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Wrench, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tenant/tickets")({
  component: TenantTicketsPage,
});

type Lease = {
  id: string;
  room_id: string;
  landlord_id: string;
  rooms: { name: string; properties: { name: string } } | null;
};

type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  room_id: string;
  created_at: string;
  rooms: { name: string; properties: { name: string } } | null;
};

type Comment = {
  id: string;
  ticket_id: string;
  body: string;
  author_id: string;
  created_at: string;
};

function statusColor(s: Ticket["status"]) {
  return s === "open"
    ? "bg-destructive/15 text-destructive"
    : s === "in_progress"
      ? "bg-gold/20 text-gold-foreground"
      : "bg-primary/15 text-primary-deep";
}

function TenantTicketsPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const { data: leases = [] } = useQuery({
    queryKey: ["tenant-leases-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select("id, room_id, landlord_id, rooms(name, properties(name))")
        .eq("tenant_id", user!.id)
        .eq("status", "active");
      if (error) throw error;
      return data as unknown as Lease[];
    },
  });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["tenant-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tickets")
        .select("*, rooms(name, properties(name))")
        .eq("tenant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Ticket[];
    },
  });

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Report issues in your unit and track progress.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={leases.length === 0}>
              <Plus className="mr-1 h-4 w-4" /> New ticket
            </Button>
          </DialogTrigger>
          <NewTicketDialog leases={leases} onDone={() => setOpen(false)} />
        </Dialog>
      </div>

      {leases.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            You need an active lease before submitting tickets.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center text-muted-foreground">
            <Wrench className="h-10 w-10" />
            <p className="mt-3 text-sm">No tickets yet — everything's working!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:border-primary/40"
              onClick={() => setSelected(t)}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{t.title}</h3>
                  <Badge className={statusColor(t.status)} variant="secondary">
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.rooms?.properties?.name} · {t.rooms?.name} · priority {t.priority}
                </p>
                {t.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {t.description}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TenantTicketDialog ticket={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function NewTicketDialog({
  leases,
  onDone,
}: {
  leases: Lease[];
  onDone: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [leaseId, setLeaseId] = useState(leases[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Ticket["priority"]>("medium");

  const create = useMutation({
    mutationFn: async () => {
      const l = leases.find((x) => x.id === leaseId);
      if (!l || !user) throw new Error("Pick a lease");
      if (!title.trim()) throw new Error("Add a title");
      const { error } = await supabase.from("maintenance_tickets").insert({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        tenant_id: user.id,
        landlord_id: l.landlord_id,
        room_id: l.room_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket submitted");
      qc.invalidateQueries({ queryKey: ["tenant-tickets"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>New maintenance ticket</DialogTitle>
        <DialogDescription>Describe the issue so your landlord can act.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label>Lease</Label>
          <Select value={leaseId} onValueChange={setLeaseId}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {leases.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.rooms?.properties?.name} · {l.rooms?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kitchen sink leaking"
          />
        </div>
        <div className="grid gap-2">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Ticket["priority"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="When did it start? Any details that help…"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancel</Button>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? "Submitting…" : "Submit"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function TenantTicketDialog({
  ticket,
  onClose,
}: {
  ticket: Ticket | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ["ticket-comments", ticket?.id],
    enabled: !!ticket,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticket!.id)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as Comment[];
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      if (!ticket || !user) return;
      if (!body.trim()) throw new Error("Write something");
      const { error } = await supabase.from("ticket_comments").insert({
        ticket_id: ticket.id,
        author_id: user.id,
        body: body.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["ticket-comments", ticket?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!ticket} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{ticket?.title}</DialogTitle>
          <DialogDescription>
            {ticket?.rooms?.properties?.name} · {ticket?.rooms?.name}
          </DialogDescription>
        </DialogHeader>
        {ticket?.description ? (
          <p className="rounded-md bg-muted/40 p-3 text-sm">{ticket.description}</p>
        ) : null}
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {comments.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" /> No replies yet.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-md border p-2 text-sm">
                <div className="text-xs text-muted-foreground">
                  {c.author_id === user?.id ? "You" : "Landlord"} ·{" "}
                  {new Date(c.created_at).toLocaleString()}
                </div>
                <div>{c.body}</div>
              </div>
            ))
          )}
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add a comment…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => post.mutate()} disabled={post.isPending}>
            {post.isPending ? "Posting…" : "Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
