import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/rooms")({
  component: () => <ComingSoon title="Rooms" desc="Room management lands in Phase 2." />,
});
