import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomDetailPage,
});

function RoomDetailPage() {
  return (
    <div className="container mx-auto max-w-3xl p-10">
      <Card>
        <CardContent className="p-12 text-center">
          <Construction className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-2xl">Room detail page</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Coming in the next phase — full room photos, amenities, and booking request flow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
