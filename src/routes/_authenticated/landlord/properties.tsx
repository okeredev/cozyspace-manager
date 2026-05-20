import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { Building2, MapPin, Plus, Pencil, Trash2, DoorOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/landlord/properties")({
  component: PropertiesPage,
});

type Property = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  description: string | null;
  cover_image_url: string | null;
};

function PropertiesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Property | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("landlord_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Property[];
    },
  });

  const { data: roomCounts = {} } = useQuery({
    queryKey: ["property-room-counts", user?.id],
    enabled: !!user && properties.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("property_id")
        .in("property_id", properties.map((p) => p.id));
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: { property_id: string }) => {
        map[r.property_id] = (map[r.property_id] ?? 0) + 1;
      });
      return map;
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("properties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Property deleted");
      qc.invalidateQueries({ queryKey: ["properties"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Properties</h1>
          <p className="text-sm text-muted-foreground">
            Buildings or homes you manage. Each property contains rooms.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-1 h-4 w-4" /> Add property
            </Button>
          </DialogTrigger>
          <PropertyDialog
            existing={editing}
            onDone={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-xl">No properties yet</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your first building to start tracking rooms, tenants, and leases.
            </p>
            <Button className="mt-5" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Card key={p.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary/15 to-primary/5">
                {p.cover_image_url ? (
                  <img
                    src={p.cover_image_url}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary/40" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-3 p-5">
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[p.address, p.city].filter(Boolean).join(", ")}
                  </p>
                </div>
                {p.description ? (
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                ) : null}
                <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DoorOpen className="h-3.5 w-3.5" />
                    {roomCounts[p.id] ?? 0} rooms
                  </span>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/landlord/rooms" search={{ property: p.id }}>
                        Manage rooms
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditing(p);
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
                          <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            All rooms inside this property will be removed. Active leases
                            will block deletion.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(p.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyDialog({
  existing,
  onDone,
}: {
  existing: Property | null;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState(existing?.name ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [city, setCity] = useState(existing?.city ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [coverUrl, setCoverUrl] = useState(existing?.cover_image_url ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!name.trim() || !address.trim()) {
        throw new Error("Name and address are required");
      }
      const payload = {
        name: name.trim(),
        address: address.trim(),
        city: city.trim() || null,
        description: description.trim() || null,
        cover_image_url: coverUrl.trim() || null,
      };
      if (existing) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("properties")
          .insert({ ...payload, landlord_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(existing ? "Property updated" : "Property created");
      qc.invalidateQueries({ queryKey: ["properties"] });
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{existing ? "Edit property" : "New property"}</DialogTitle>
        <DialogDescription>
          A property is a building or address. Add rooms inside it next.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sunset Heights"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Street address</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="221B Baker Street"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city ?? ""}
            onChange={(e) => setCity(e.target.value)}
            placeholder="London"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea
            id="desc"
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Short summary for tenants browsing the marketplace."
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cover">Cover image URL (optional)</Label>
          <Input
            id="cover"
            value={coverUrl ?? ""}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
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
