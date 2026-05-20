import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/tenant/tickets")({
  component: () => <ComingSoon title="Maintenance" desc="Report & track maintenance issues — Phase 6." />,
});
