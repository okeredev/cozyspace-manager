import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/tickets")({
  component: () => <ComingSoon title="Maintenance" desc="Ticket queue with photos & comments — Phase 6." />,
});
