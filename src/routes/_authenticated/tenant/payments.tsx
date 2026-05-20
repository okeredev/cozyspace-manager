import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/tenant/payments")({
  component: () => <ComingSoon title="My payments" desc="Payment history & receipts — Phase 5." />,
});
