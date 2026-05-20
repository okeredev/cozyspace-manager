import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/labels")({
  component: () => <ComingSoon title="Room labels" desc="Custom color-coded labels — Phase 2." />,
});
