import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/coming-soon";
export const Route = createFileRoute("/_authenticated/tenant/profile")({
  component: () => <ComingSoon title="Profile" desc="Edit your profile, contacts & documents — Phase 4." />,
});
