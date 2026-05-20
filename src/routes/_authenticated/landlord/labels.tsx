import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/landlord/labels")({
  component: LabelsPage,
});

type RoomLabel = { id: string; name: string; color: string };

const PRESETS = [
  "#10b981",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#6366f1",
  "#475569",
];

function LabelsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESETS[0]);

  const { data: labels = [], isLoading } = useQuery({
    queryKey: ["labels", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_labels")
        .select("*")
        .eq("landlord_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as RoomLabel[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!name.trim()) throw new Error("Name is required");
      const { error } = await supabase.from("room_labels").insert({
        landlord_id: user.id,
        name: name.trim(),
        color,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Label created");
      setName("");
      qc.invalidateQueries({ queryKey: ["labels"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("room_labels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Label deleted");
      qc.invalidateQueries({ queryKey: ["labels"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="container mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl">Room labels</h1>
        <p className="text-sm text-muted-foreground">
          Custom tags like "Top floor", "Renovated", or "Pet friendly" you can attach
          to rooms.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
            <div className="grid gap-2">
              <Label htmlFor="lname">New label</Label>
              <Input
                id="lname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Top floor"
                onKeyDown={(e) => {
                  if (e.key === "Enter") create.mutate();
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex h-10 items-center gap-1.5 rounded-md border bg-background px-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="h-6 w-6 rounded-full ring-offset-2 transition-all"
                    style={{
                      background: c,
                      boxShadow:
                        color === c ? "0 0 0 2px var(--ring)" : "none",
                    }}
                    aria-label={`Pick ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={() => create.mutate()} disabled={create.isPending}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : labels.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <Tag className="h-8 w-8" />
              <p className="mt-2 text-sm">No labels yet — create your first above.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {labels.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between py-3"
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: l.color }}
                    />
                    <span className="font-medium">{l.name}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => del.mutate(l.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
