import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, DoorOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/properties")({
  component: AdminProperties,
});

function AdminProperties() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id,name,address,city,landlord_id,cover_image_url,created_at,rooms(id,name,price,status)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold">All properties</h1>
          <p className="text-sm text-muted-foreground">
            Every property across all landlords on the platform.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : properties?.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No properties yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(properties ?? []).map((p: any) => {
            const occupied = p.rooms?.filter((r: any) => r.status === "occupied").length ?? 0;
            const totalRooms = p.rooms?.length ?? 0;
            const totalRent = (p.rooms ?? []).reduce((s: number, r: any) => s + Number(r.price ?? 0), 0);
            return (
              <Card key={p.id} className="overflow-hidden">
                {p.cover_image_url && (
                  <img src={p.cover_image_url} alt={p.name} className="h-40 w-full object-cover" />
                )}
                <CardContent className="space-y-3 p-5">
                  <div>
                    <div className="font-display text-lg">{p.name}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.address}{p.city ? `, ${p.city}` : ""}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Rooms</div>
                      <div className="font-display text-lg">{totalRooms}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Occupied</div>
                      <div className="font-display text-lg">{occupied}/{totalRooms}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Rent roll</div>
                      <div className="font-display text-lg">₦{totalRent.toLocaleString()}</div>
                    </div>
                  </div>
                  {p.rooms?.length ? (
                    <ul className="space-y-1 text-sm">
                      {p.rooms.slice(0, 4).map((r: any) => (
                        <li key={r.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-1.5">
                          <span className="flex items-center gap-2">
                            <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                            {r.name}
                            <span className="text-xs capitalize text-muted-foreground">· {r.status}</span>
                          </span>
                          <span>₦{Number(r.price).toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="text-xs text-muted-foreground">
                    Landlord: <span className="font-mono">{p.landlord_id.slice(0, 8)}…</span>
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
