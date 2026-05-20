import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Wrench, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/landlord/tickets")({
  component: TicketsPage,
});

type Ticket = {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  tenant_id: string;
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

function priorityColor(p: Ticket["priority"]) {
  return p === "urgent"
    ? "bg-destructive/15 text-destructive"
    : p === "high"
      ? "bg-gold/20 text-gold-foreground"
      : "bg-muted text-muted-foreground";
}

function statusColor(s: Ticket["status"]) {
  return s === "open"
    ? "bg-destructive/15 text-destructive"
    : s === "in_progress"
      ? "bg-gold/20 text-gold-foreground"
      : "bg-primary/15 text-primary-deep";
}

function TicketsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<"all" | Ticket["status"]>("all");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["landlord-tickets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_tickets")
        .select("*, rooms(name, properties(name))")
        .eq("landlord_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Ticket[];
    },
  });

  const filtered = useMemo(
    () => (filter === "all" ? tickets : tickets.filter((t) => t.status === filter)),
    [tickets, filter],
  );

  const update = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: { status?: Ticket["status"]; priority?: Ticket["priority"] };
    }) => {
      const { error } = await supabase
        .from("maintenance_tickets")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket updated");
      qc.invalidateQueries({ queryKey: ["landlord-tickets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Tickets from your tenants — triage, assign priority, and resolve.
          </p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center text-muted-foreground">
            <Wrench className="h-10 w-10" />
            <p className="mt-3 text-sm">No tickets here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:border-primary/40" onClick={() => setSelected(t)}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{t.title}</h3>
                    <Badge className={priorityColor(t.priority)} variant="secondary">
                      {t.priority}
                    </Badge>
                    <Badge className={statusColor(t.status)} variant="secondary">
                      {t.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.rooms?.properties?.name} · {t.rooms?.name} ·{" "}
                    {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  {t.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {t.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={t.priority}
                    onValueChange={(v) =>
                      update.mutate({ id: t.id, patch: { priority: v as Ticket["priority"] } })
                    }
                  >
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={t.status}
                    onValueChange={(v) =>
                      update.mutate({ id: t.id, patch: { status: v as Ticket["status"] } })
                    }
                  >
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TicketDialog
        ticket={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

export function TicketDialog({
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
              <MessageSquare className="h-3 w-3" /> No comments yet.
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-md border p-2 text-sm">
                <div className="text-xs text-muted-foreground">
                  {c.author_id === user?.id ? "You" : "Other party"} ·{" "}
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
          placeholder="Reply…"
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => post.mutate()} disabled={post.isPending}>
            {post.isPending ? "Posting…" : "Post comment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
