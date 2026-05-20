import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/tenants")({
  component: () => <ComingSoon title="Tenants" desc="Tenant directory & invitations — Phase 4." />,
});
