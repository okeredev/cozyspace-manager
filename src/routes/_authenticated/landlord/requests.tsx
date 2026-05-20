import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Check, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/landlord/requests")({
  component: RequestsPage,
});

type Req = {
  id: string;
  message: string | null;
  move_in_date: string | null;
  status: "pending" | "approved" | "declined" | "cancelled";
  created_at: string;
  tenant_id: string;
  room_id: string;
  rooms: { name: string; properties: { name: string } } | null;
};

function RequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["booking-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_requests")
        .select(
          "id, message, move_in_date, status, created_at, tenant_id, room_id, rooms(name, properties(name))",
        )
        .eq("landlord_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Req[];
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "declined";
    }) => {
      const { error } = await supabase
        .from("booking_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "approved" ? "Request approved" : "Request declined",
      );
      qc.invalidateQueries({ queryKey: ["booking-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl">Booking requests</h1>
        <p className="text-sm text-muted-foreground">
          Incoming requests from tenants browsing your listed rooms.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center text-muted-foreground">
            <Inbox className="h-10 w-10" />
            <p className="mt-3 text-sm">No booking requests yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {r.rooms?.name} · {r.rooms?.properties?.name}
                    </h3>
                    <Badge
                      variant={r.status === "pending" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {r.status}
                    </Badge>
                  </div>
                  {r.move_in_date ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Move-in {r.move_in_date}
                    </p>
                  ) : null}
                  {r.message ? (
                    <p className="mt-2 max-w-xl text-sm">{r.message}</p>
                  ) : null}
                </div>
                {r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        update.mutate({ id: r.id, status: "declined" })
                      }
                    >
                      <X className="mr-1 h-4 w-4" /> Decline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        update.mutate({ id: r.id, status: "approved" })
                      }
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
