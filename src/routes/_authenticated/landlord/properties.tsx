import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/properties")({
  component: () => <ComingSoon title="Properties" desc="Property CRUD lands in Phase 2." />,
});
