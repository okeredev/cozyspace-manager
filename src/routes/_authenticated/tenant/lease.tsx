import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/tenant/lease")({
  component: () => <ComingSoon title="My lease" desc="Full lease details & documents — Phase 4." />,
});
