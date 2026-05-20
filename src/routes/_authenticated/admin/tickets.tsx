import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  component: AdminTickets,
});

const statusTone: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  resolved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

function AdminTickets() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("maintenance_tickets")
        .select("id,title,description,status,priority,created_at,rooms(name,properties(name))")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Wrench className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold">All maintenance</h1>
          <p className="text-sm text-muted-foreground">
            Cross-platform ticket activity.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : tickets?.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tickets reported.
            </div>
          ) : (
            <ul className="divide-y">
              {(tickets ?? []).map((t: any) => (
                <li key={t.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.rooms?.properties?.name ?? "—"} · {t.rooms?.name ?? "—"} ·{" "}
                        {new Date(t.created_at).toLocaleDateString()}
                      </div>
                      {t.description && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                        {t.priority}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                          statusTone[t.status] ?? "bg-muted"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
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
