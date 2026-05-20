import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/requests")({
  component: () => <ComingSoon title="Booking requests" desc="Approve & decline incoming requests — Phase 3." />,
});
