import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/leases")({
  component: () => <ComingSoon title="Leases" desc="Lease lifecycle management — Phase 4." />,
});
