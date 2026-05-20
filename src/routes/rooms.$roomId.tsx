import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import {
  ArrowLeft,
  MapPin,
  Users,
  CheckCircle2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomDetailPage,
});

type Room = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  deposit: number;
  first_payment: number;
  lease_duration_months: number;
  capacity: number;
  status: "vacant" | "reserved" | "occupied" | "maintenance";
  photos: string[] | null;
  amenities: string[] | null;
  is_listed: boolean;
  property_id: string;
  label_id: string | null;
  properties: {
    name: string;
    address: string;
    city: string | null;
    description: string | null;
    landlord_id: string;
  } | null;
  room_labels: { name: string; color: string } | null;
};

function RoomDetailPage() {
  const { roomId } = Route.useParams();
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [moveIn, setMoveIn] = useState(
    new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10),
  );

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(
          "*, properties(name, address, city, description, landlord_id), room_labels(name, color)",
        )
        .eq("id", roomId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Room | null;
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["my-booking", roomId, user?.id],
    enabled: !!user && !!room,
    queryFn: async () => {
      const { data } = await supabase
        .from("booking_requests")
        .select("id, status, created_at")
        .eq("room_id", roomId)
        .eq("tenant_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const request = useMutation({
    mutationFn: async () => {
      if (!user || !room?.properties)
        throw new Error("Sign in as a tenant to request");
      const { error } = await supabase.from("booking_requests").insert({
        tenant_id: user.id,
        landlord_id: room.properties.landlord_id,
        room_id: room.id,
        message: message.trim() || null,
        move_in_date: moveIn,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request sent — the landlord will review it shortly");
      setMessage("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="container mx-auto p-10 text-sm text-muted-foreground">
          Loading…
        </div>
      </>
    );
  }

  if (!room) {
    return (
      <>
        <SiteHeader />
        <div className="container mx-auto max-w-2xl p-10">
          <Card>
            <CardContent className="p-10 text-center">
              <h2 className="font-display text-2xl">Room not found</h2>
              <Button asChild className="mt-4">
                <Link to="/browse">Browse rooms</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const isLandlord = roles.includes("landlord");
  const canRequest =
    !isLandlord &&
    !!user &&
    !existing &&
    room.status === "vacant" &&
    room.is_listed;

  return (
    <>
      <SiteHeader />
      <div className="container mx-auto max-w-5xl space-y-8 p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/browse" })}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to rooms
        </Button>

        {room.photos && room.photos.length > 0 ? (
          <div className="grid gap-2 overflow-hidden rounded-2xl md:grid-cols-3 md:grid-rows-2">
            <img
              src={room.photos[0]}
              alt={room.name}
              className="aspect-video w-full object-cover md:col-span-2 md:row-span-2 md:aspect-auto"
            />
            {room.photos.slice(1, 5).map((p, i) => (
              <img
                key={i}
                src={p}
                alt=""
                className="aspect-video w-full object-cover"
              />
            ))}
          </div>
        ) : (
          <div className="grid aspect-[16/7] place-items-center rounded-2xl bg-muted text-muted-foreground">
            No photos yet
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl">{room.name}</h1>
                {room.room_labels ? (
                  <Badge
                    style={{
                      backgroundColor: `${room.room_labels.color}22`,
                      color: room.room_labels.color,
                    }}
                    variant="secondary"
                  >
                    {room.room_labels.name}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="capitalize">
                  {room.status}
                </Badge>
              </div>
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {room.properties?.name} · {room.properties?.address}
                {room.properties?.city ? `, ${room.properties.city}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-6 border-y py-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Capacity</div>
                <div className="mt-1 flex items-center gap-1 font-display text-lg">
                  <Users className="h-4 w-4" /> {room.capacity}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Deposit</div>
                <div className="mt-1 font-display text-lg">
                  ${Number(room.deposit).toFixed(0)}
                </div>
              </div>
            </div>

            {room.description ? (
              <div>
                <h2 className="font-display text-xl">About this room</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {room.description}
                </p>
              </div>
            ) : null}

            {room.amenities && room.amenities.length > 0 ? (
              <div>
                <h2 className="font-display text-xl">Amenities</h2>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {room.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {room.properties?.description ? (
              <div>
                <h2 className="font-display text-xl">About the property</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {room.properties.description}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardContent className="space-y-4 p-6">
                <div>
                  <div className="font-display text-3xl">
                    ${Number(room.price).toFixed(0)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / month
                    </span>
                  </div>
                </div>

                {!user ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Sign in to request this room.
                    </p>
                    <Button asChild className="w-full">
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </>
                ) : isLandlord ? (
                  <p className="text-sm text-muted-foreground">
                    Landlords can't book — switch to a tenant account.
                  </p>
                ) : existing ? (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="capitalize">
                      Request {existing.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Sent {new Date(existing.created_at).toLocaleDateString()}.
                      You'll get an update when the landlord responds.
                    </p>
                  </div>
                ) : room.status !== "vacant" || !room.is_listed ? (
                  <p className="text-sm text-muted-foreground">
                    Not currently accepting requests.
                  </p>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="movein">Move-in date</Label>
                      <Input
                        id="movein"
                        type="date"
                        value={moveIn}
                        onChange={(e) => setMoveIn(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="msg">Message (optional)</Label>
                      <Textarea
                        id="msg"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="Tell the landlord a bit about yourself"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => request.mutate()}
                      disabled={request.isPending && canRequest}
                    >
                      <Send className="mr-1 h-4 w-4" />
                      {request.isPending ? "Sending…" : "Request to book"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      No charge yet — this just notifies the landlord.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
