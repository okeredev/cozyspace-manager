import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/landlord/payments")({
  component: () => <ComingSoon title="Payments" desc="Record rent & generate receipts — Phase 5." />,
});
