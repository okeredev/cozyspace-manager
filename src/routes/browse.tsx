import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DoorOpen, MapPin } from "lucide-react";

export const Route = createFileRoute("/browse")({
  component: BrowsePage,
  head: () => ({
    meta: [
      { title: "Browse available rooms — RentHub" },
      { name: "description", content: "Find a room from verified landlords on RentHub." },
    ],
  }),
});

function BrowsePage() {
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["public-rooms"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rooms")
        .select("id,name,price,status,photos,description,properties(name,address,city),room_labels:label_id(name,color)")
        .eq("is_listed", true)
        .eq("status", "vacant")
        .order("created_at", { ascending: false })
        .limit(60);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Available rooms</h1>
          <p className="mt-2 text-muted-foreground">
            Verified rooms from landlords on RentHub. Request a booking and the landlord takes it from there.
          </p>
        </div>

        <div className="mt-10">
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : rooms && rooms.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((r) => {
                const label = (r as any).room_labels;
                return (
                  <Link key={r.id} to="/rooms/$roomId" params={{ roomId: r.id }} className="group block">
                    <Card className="overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
                      <div className="relative aspect-[4/3] bg-muted">
                        {r.photos?.[0] ? (
                          <img src={r.photos[0]} alt={r.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full place-items-center text-muted-foreground">
                            <DoorOpen className="h-10 w-10" />
                          </div>
                        )}
                        {label && (
                          <Badge
                            className="absolute left-3 top-3 border-0"
                            style={{ backgroundColor: label.color, color: "#fff" }}
                          >
                            {label.name}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-lg font-semibold">{r.name}</h3>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {r.properties?.name}{r.properties?.city ? ` · ${r.properties.city}` : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-display text-xl">${Number(r.price).toLocaleString()}</div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">/ month</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <DoorOpen className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-display text-xl">No rooms listed yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check back soon — landlords are adding properties to RentHub.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
