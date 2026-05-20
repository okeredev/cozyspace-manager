import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, Calendar, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tenant/lease")({
  component: LeasePage,
});

type LeaseRow = {
  id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount: number;
  billing_cycle: string;
  status: string;
  notes: string | null;
  rooms: {
    name: string;
    photos: string[] | null;
    amenities: string[] | null;
    properties: { name: string; address: string; city: string | null } | null;
  } | null;
};

function daysUntil(end: string) {
  return Math.ceil(
    (new Date(end).getTime() - Date.now()) / 86_400_000,
  );
}

function LeasePage() {
  const { user } = useAuth();

  const { data: leases = [], isLoading } = useQuery({
    queryKey: ["my-leases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(
          "id, start_date, end_date, rent_amount, deposit_amount, billing_cycle, status, notes, rooms(name, photos, amenities, properties(name, address, city))",
        )
        .eq("tenant_id", user!.id)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as unknown as LeaseRow[];
    },
  });

  if (isLoading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;

  if (leases.length === 0) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center text-muted-foreground">
            <Home className="h-10 w-10" />
            <p className="mt-3 text-sm">You don't have a lease yet.</p>
            <Button asChild className="mt-4">
              <Link to="/browse">Browse rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl">My lease</h1>
        <p className="text-sm text-muted-foreground">Full details and history.</p>
      </div>

      {leases.map((l) => {
        const remaining = daysUntil(l.end_date);
        const expiring = remaining >= 0 && remaining <= 30;
        return (
          <Card key={l.id} className="overflow-hidden">
            {l.rooms?.photos?.[0] ? (
              <img
                src={l.rooms.photos[0]}
                alt={l.rooms?.name ?? ""}
                className="h-48 w-full object-cover"
              />
            ) : null}
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">
                    {l.rooms?.properties?.name} · {l.rooms?.name}
                  </h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {l.rooms?.properties?.address}
                    {l.rooms?.properties?.city ? `, ${l.rooms.properties.city}` : ""}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {expiring && l.status === "active" ? "expiring soon" : l.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 sm:grid-cols-4">
                <Stat icon={<DollarSign className="h-3 w-3" />} label="Rent" value={`₦${Number(l.rent_amount).toFixed(0)}`} />
                <Stat icon={<DollarSign className="h-3 w-3" />} label="Deposit" value={`₦${Number(l.deposit_amount).toFixed(0)}`} />
                <Stat icon={<Calendar className="h-3 w-3" />} label="Start" value={l.start_date} />
                <Stat icon={<Calendar className="h-3 w-3" />} label="End" value={l.end_date} />
              </div>

              {l.rooms?.amenities && l.rooms.amenities.length > 0 ? (
                <div className="border-t pt-4">
                  <div className="text-xs text-muted-foreground">Amenities</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {l.rooms.amenities.map((a) => (
                      <Badge key={a} variant="outline">{a}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {l.notes ? (
                <div className="border-t pt-4">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{l.notes}</p>
                </div>
              ) : null}

              {expiring && l.status === "active" ? (
                <div className="rounded-md border border-gold/40 bg-gold/10 p-3 text-sm">
                  Your lease ends in {remaining} day{remaining === 1 ? "" : "s"}.
                  Talk to your landlord about renewal.
                </div>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-1 font-display text-lg">{value}</div>
    </div>
  );
}
